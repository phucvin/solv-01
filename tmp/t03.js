const e_updateTxt = eHandler((count, baseCount, countTxt, ctx) => {
    countTxt.innerHTML.value = baseCount.value + count.value;
});

const e_disable = eHandler((count, baseCount, resetBtn, ctx) => {
    const disabled = count.value < baseCount.value * 2;
    const className = 'bg-red ';
    resetBtn.className.value = className + (disabled ? 'disabled' : '');
    resetBtn.disabled.value = disabled;
});

const a_inc = aHandler((count, ctx) => {
    count.value += 1;
});

const a_reset = aHandler((count, baseCount, ctx) => {
    count.value = baseCount.value;
});

function Counter(props, ctx) {
    const count = ctx.sig(0);

    const el = ctx.el('div');
    const countTxt = ctx.el('span');
    const incBtn = ctx.el('button');
    incBtn.innerHTML.value = 'inc';
    incBtn.onclick.value = [a_inc, count];
    const resetBtn = ctx.el('button');
    resetBtn.innerHTML.value = 'reset';
    resetBtn.onclick.value = [a_reset, count, baseCount];
    el.children.value = [state.countTxt, incBtn, resetBtn];

    ctx.eff(e_updateTxt, count, props.baseCount, countTxt);
    ctx.eff(e_disable, count, props.baseCount, resetBtn);

    return el;
}

function runEff(eff, ctx) {
    const handler = eHandlerGet(eff[0]);
    const args = [];
    for (const arg of eff.slice(1)) {
        if (arg.t == 's') {
            args.push({
                get value() {
                    return ctx.sigs[arg.id];
                },
                set value(x) {
                    ctx.sigs[arg.id] = x;
                    if (ctx.pendingSigs[-1] != arg.id) {
                        ctx.pendingSigs.push(arg.id);
                    }
                },
            });
        } else if (arg.t == 'el') {
            args.push(new Proxy({ t: 'el', id: arg.id }, {
                set(obj, name, newValue) {
                    ctx.cmds.push([{ t: obj.t, id: obj.id }, name, newValue]);
                }
            }));
        }
    }
    args.push(ctx);
    handler(...args);
}

function runAction(action, ctx) {
    // somewhat similar to runEffect

    resolvePendingSignals(ctx);
}

function build(comp, props, ctx) {
    const effs = []
    const ctx2 = {
        el: (tag) => {
            ctx.cmds.push([{ t: 'el', id: ctx.nextId() }, '$create', tag]);
            return new Proxy({}, {
                set(obj, name, newValue) {
                    ctx.cmds.push([{ t: obj.t, id: obj.id }, name, newValue]);
                }
            });
        },
        sig: (init) => ({ id: nextId(), value: init }),
        effect: (...args) => {
            ctx.effs[ctx.nextId()] = args;
            effs.push(args);
        }
    };
    const el = comp(props, ctx2);
    for (const eff of effs) {
        runEff(eff, ctx);
    }
    
    resolvePendingSignals(ctx);
    return el;
}

function resolvePendingSignals(ctx) {
    // find affected effects from current pending signals, clear pending signals, run effects, repeat
}

let ctx = {
    sigs: { 7: 10 },
    pendingSigs: [],
    cmds: [],
    effs: {},
    elRemoval: {},
};
build(Counter, { baseCount: { t: 's', id: 10 }}, ctx) == { t: 'el', id: 2 };
ctx == {
    sigs: {
        1: 0,
        7: 10,
    },
    cmds: [  // can probably remove prefix `{ t: 'el'` since it's always that
        [{ t: 'el', id: 2 }, '$create', 'div'],
        [{ t: 'el', id: 8 }, '$create', 'span'],
        [{ t: 'el', id: 3 }, '$create', 'button'],
        [{ t: 'el', id: 5 }, '$create', 'button'],
        [{ t: 'el', id: 3 }, 'innerHtml', 'inc'],
        [{ t: 'el', id: 3 }, 'onclick', [{ t: 'a', id: 4 }, { t: 's', id: 1 }]],
        [{ t: 'el', id: 5 }, 'innerHtml', 'reset'],
        [{ t: 'el', id: 5 }, 'onclick', [{ t: 'a', id: 6 }, { t: 's', id: 1 }, { t: 's', id: 7 }]],
        [{ t: 'el', id: 2 }, 'children', [{ t: 'el', id: 8 }, { t: 'el', id: 3 }, { t: 'el', id: 5 }]],
        [{ t: 'el', id: 8 }, 'innerHtml', 10],
        [{ t: 'el', id: 5 }, 'disabled', true],
        [{ t: 'el', id: 5 }, 'class', 'bg-red disabled'],
    ],
    effs: {
        9: ['e_updateTxt', { t: 's', id: 1 }, { t: 's', id: 7 }, { t: 'el', id: 8 }],
        10: ['e_disable', { t: 's', id: 1 }, { t: 's', id: 7 }, { t: 'el', id: 5 }],
    },
    elRemoval: {
        2: {
            sigs: [1],
            effs: [9, 10],
        },
    }
};
// After inc clicked
ctx == {
    sigs: {
        1: 2,
        7: 10,
    },
    pendingSigs: [1],
    cmds: [],
    // others are the same
};
// After resolving pending signals
ctx == {
    sigs: {
        1: 2,
        7: 10,
    },
    pendingSigs: [],
    cmds: [
        [{ t: 'el', id: 8 }, 'innerHtml', 11],
    ],
    // others are the same
};