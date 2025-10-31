// Drafting signals

function CounterActions() {
    return {
        'inc': (s) => s.value += 1,
    }
}

function CounterCompute() {
    return {
        's': [
            ['count', (count, s) => count.innerHTML = s.value],
        ]
    }
}

function Counter(input, output, context) {
    const s = context.sig().ref('s');
    const el = context.el('div');
    const title = context.el('h3');
    title.innerHTML = 'Counter';
    const count = context.el('span').ref('count');
    const inc = context.el('button');
    inc.innerHTML = 'inc';
    inc.onclick = context.act('inc', s);
    el.children = [title, count];
    return el;
}

function ssr(el) {
    return `
<div _eid=4>
    <h3 _eid=5>Counter</h3>
    <span _eid=6>0</span>
    <button _eid=7 onclick="dispatch('_aid_1')"></button>
</div>
`;
}

function diff() {
    return `
[
    { _eid: 6, innerHTML: "1" },
]
`;
}