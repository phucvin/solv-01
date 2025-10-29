import { assert } from "./shared01.js";

function eventName(str) {
    if (str.indexOf('on') == 0) {
        return str.slice(2).toLowerCase();
    }
    return null;
}

export function diffOne(l, r) {
    const isText = l.text !== undefined;
    if (isText) {
        return l.text !== r.text ? { r: r } /*replace*/ : { /*noop*/ };
    }

    if (l.tag !== r.tag) {
        return { r: r };  // replace
    }

    let remove = [];
    let set = {};

    for (const prop in l.properties) {
        const l_prop_val = l.properties[prop];
        const r_prop_val = r.properties[prop];
        if ((r_prop_val === undefined || r_prop_val === false) && l_prop_val) {
            remove.push(prop);
        }
    }

    for (const prop in r.properties) {
        const r_prop_val = r.properties[prop];
        if (r_prop_val === undefined || r_prop_val === false) {
            continue;
        }
        if (
            JSON.stringify(r_prop_val) !== JSON.stringify(l.properties[prop])
        ) {
            set[prop] = r_prop_val;
        }
    }

    const childrenDiff = diffList(l.children, r.children);
    const noChildrenChange = childrenDiff.every((e) => Object.keys(e).length == 0);
    const noRemove = remove.length == 0;
    const noSet = Array.from(Object.keys(set)).length == 0;

    if (noChildrenChange && noRemove && noSet) {
        return { /*noop*/ };
    } else {
        const modify = {};
        if (!noRemove) {
            modify.d = remove;  // delete/remove
        }
        if (!noSet) {
            modify.s = set;  // set
        }
        if (!noChildrenChange) {
            modify.c = childrenDiff;  // children
        }
        return { m: modify };  // modify
    }
}

export function diffList(ls, rs) {
    assert(rs instanceof Array, 'Expected an array, found', rs);
    const length = Math.max(ls.length, rs.length);

    const getKeys = (s) => {
        let keys = {};
        for (const i in s) {
            const k = s[i]?.properties?._SOLV_KEY;
            if (k !== undefined) {
                if (keys[k] !== undefined) {
                    return {};
                }
                keys[k] = i;
            }
        }
        return keys;
    };
    const lkeys = getKeys(ls);
    const rkeys = getKeys(rs);

    // NOTE: this doesn't work if a child is inserted into a middle
    let ld = 0, rd = 0;
    return Array.from({ length }).map((_, i) => {
        const l = ls[i + ld], r = rs[i + rd];
        const lk = l?.properties?._SOLV_KEY;
        const rk = r?.properties?._SOLV_KEY;
        if (l === undefined) {
            return { n: r };
        } else if (r === undefined) {
            return { d: true };
        } else if (lk !== undefined && !(lk in rkeys)) {
            rd -= 1;
            return { d: true };
        } else if (rk in lkeys) {
            return diffOne(ls[lkeys[rk]], r);
        } else if (lk in rkeys) {
            return diffOne(l, rs[rkeys[lk]]);
        } else {
            return diffOne(l, r);
        }
    });
}

export function createRenderContext(solvState) {
    return {
        _nextEid: 1,
        nextEid: function () {
            return `_eid_${this._nextEid++}`;
        },
        reset: function () {
            this._nextEid = 1;
        },

        _solvState: solvState,
        nextIid: function() {
            assert(Number.isInteger(this._solvState.nextIid));
            return `_iid_${this._solvState.nextIid++}`;
        },

        _pendingTaskCount: 0,
        _tasks: {},
        streaming: function () { return this._pendingTaskCount > 0; },
        addTask: function (tid, task) {
            assert(this._tasks[tid] === undefined, 'task already exists', tid);
            if (!task.isDone) {
                this._pendingTaskCount += 1;
                task = task.then((res) => { this._pendingTaskCount -= 1; return res; });
            }
            this._tasks[tid] = task;
        },
        getTaskIfAny: async function (tid) {
            return this._tasks[tid] || Promise.resolve();
        },
    };
}

export function ssr(vdom) {
    if (vdom instanceof Array) {
        let children = '';
        for (const child of vdom) {
            children += ssr(child);
        }
        return children;
    } else if (vdom.text != null) {
        return vdom.text;
    } else if (vdom.tag) {
        let properties = '';
        for (const prop in vdom.properties) {
            const prop_val = vdom.properties[prop];
            if (prop_val === undefined || prop_val === false) {
                continue;
            }
            const event = eventName(prop);
            if (event) {
                properties += ` ${prop}='dispatch(${JSON.stringify(prop_val)})'`;
            } else if (prop_val === true) {
                properties += ` ${prop}`;
            } else {
                properties += ` ${prop}="${prop_val}"`;
            }
        }
        let children = '';
        for (const child of vdom.children) {
            children += ssr(child);
        }
        return `<${vdom.tag}${properties}>${children}</${vdom.tag}>`;
    } else {
        assert(false, 'unknown vdom type', vdom);
    }
}