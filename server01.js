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
        return l.text !== r.text ? { replace: r } : { noop: true };
    }

    if (l.tag !== r.tag) {
        return { replace: r };
    }

    const remove = [];
    const set = {};

    for (const prop in l.properties) {
        const r_prop_val = r.properties[prop];
        if (r_prop_val === undefined || r_prop_val === false) {
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

    const children = diffList(l.children, r.children);
    const noChildrenChange = children.every((e) => e.noop);
    const noPropertyChange =
        remove.length === 0 && Array.from(Object.keys(set)).length == 0;

    return noChildrenChange && noPropertyChange
        ? { noop: true }
        : { modify: { remove, set, children } };
}

export function diffList(ls, rs) {
    assert(rs instanceof Array, 'Expected an array, found', rs);
    const length = Math.max(ls.length, rs.length);
    return Array.from({ length }).map((_, i) =>
        ls[i] === undefined
            ? { create: rs[i] }
            : rs[i] == undefined
                ? { remove: true }
                : diffOne(ls[i], rs[i])
    );
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
        if (vdom.children.length > 0) {
            let children = '';
            for (const child of vdom.children) {
                children += ssr(child);
            }
            return `<${vdom.tag}${properties}>${children}</${vdom.tag}>`;
        } else {
            return `<${vdom.tag}${properties}/>`;
        }
    } else {
        assert(false, 'unknown vdom type', vdom);
    }
}