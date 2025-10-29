import { h, text } from './../shared01.js';

export function initState(/*props*/ { startCount = 0 } = {}) {
    return { count: startCount };
}

export async function render(state, action, context, /*props*/ { iid, title, removeAction }) {
    const INC = `_${iid}_INC`;
    const RESET = `_${iid}_RESET`;

    switch (action?.t) {
        case INC:
            state.count += action.p.delta;
            break;
        case RESET:
            state.count = 0;
            break;
    }

    return [
        h(
            'div',
            {
                class:
                    'relative bg-white p-8 rounded-lg shadow-md flex flex-col items-center space-x-4 space-y-4',
            },
            [
                h('h1', { class: 'text-3xl font-bold mb-4' }, [text(title || 'untitled')]),
                h('span', { class: 'text-5xl font-semibold text-gray-800"' }, [text(`${state.count}`)]),
                h(
                    'button',
                    {
                        class:
                            'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-2xl',
                        onclick: { t: INC, p: { delta: 1 } },
                    },
                    [text('inc')]
                ),
                h(
                    'button',
                    {
                        class:
                            'bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed ' +
                            'text-white font-bold py-2 px-4 rounded-full text-2xl',
                        disabled: state.count == 0,
                        onclick: state.count > 0 ? { t: RESET } : undefined,
                    },
                    [text('reset')]
                ),
                h(
                    'button',
                    {
                        class: 'absolute top-0 right-0 p-2 m-2 text-red-500 hover:text-red-700',
                        onclick: removeAction,
                    },
                    [text('x')]
                ),
            ]
        ),
    ];
}