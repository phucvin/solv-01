import { h, text } from './../shared01.js';

export function initState() {
    return {};
}

export async function render(state, action, context, /*props*/ { iid, text: propsText }) {
    return [
        h('span', { class: 'text-5xl font-semibold text-gray-800"' }, [text(propsText)]),
    ];
}