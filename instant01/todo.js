import { h, text } from './../shared01.js';

export function initState() {
    return {};
}

export async function render(state, action, context, /*props*/ { iid, text: propsText }) {
    return [
        h('div', { class: 'bg-white p-8 rounded-lg shadow-md flex flex-col items-center space-x-4 space-y-4' }, [
            h('span', { class: 'text-3xl font-semibold text-gray-800"' }, [text(propsText)]),
        ]),
    ];
}