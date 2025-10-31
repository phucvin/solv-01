// Drafting signals

function CounterAct(action, state, ctx) {
    assert(action.c == 'Counter');
    const { count, baseCount } = state;
    switch (action.t) {
        case 'inc':
            count.value += 1;
            break;
        case 'reset':
            count = baseCount.value;
            break;
    }
}

function CounterEffects(state, ctx) {
    const { countTxt, baseCount, count, resetBtn } = state;
    return [
        () => {
            countTxt.innerHTML.value = baseCount.value + count.value;
        },
        () => {
            const disabled = count.value < baseCount.value + 10;
            const className = 'bg-red ';
            resetBtn.className.value = className + (disabled ? 'disabled' : '');
            resetBtn.disabled.value = disabled;
        },
    ];
}

function Counter(props, ctx) {
    const state = {};
    state.baseCount = props.baseCount;
    state.count = ctx.sig(0);

    const el = ctx.el('div');
    state.countTxt = ctx.el('span');
    const incBtn = ctx.el('button');
    incBtn.innerHTML.value = 'inc';
    incBtn.onclick.value = { t: 'inc' };
    state.resetBtn = ctx.el('button');
    resetBtn.innerHTML.value = 'reset';
    resetBtn.onclick.value = { t: 'reset' };
    el.children.value = [state.countTxt, incBtn, resetBtn];

    return { c: 'Counter', state, el, act: CounterAct, effects: CounterEffects };
}

// Ideal Solid-like code that can be compiled to above
const Counter = ({ baseCount }) => {
    const [count, setCount] = createSignals();
    const disabled = createMemo(() => count() < baseCount() + 10);

    return (
        <div>
            <span>{baseCount() + count()}</span>
            <button onclick={() => setCount(count() + 1)}>inc</button>
            <button
                disabled={disabled()}
                className={`bg-red ${disabled ? 'disabled' : ''}`}
                onclick={() => setCount(baseCount())}>
                reset
            </button>
        </div>
    );
};