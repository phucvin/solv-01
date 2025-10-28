import { h, text } from './../shared01.js';

export function initState(id) {
    return { count: 1 };
}

export function render(state, action, context) {
    let justReset = false;

    switch (action?.t) {
        case 'INC':
            let modifiers = 1;
            if (action.p.modifiers === '*2') {
                modifiers = 2;
            }
            state.count += action.p.delta * modifiers;
            break;
        case 'RESET':
            justReset = true;
            state.count = 0;
            break;
    }

    const modifiersId = context.nextId();

    return [
        h('head', {}, [
            h('title', {}, [text((justReset ? 'RESETED - ' : '') + 'Counter 01 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex items-center justify-center min-h-screen bg-gray-100" }, [
            h(
                'div',
                {
                    class:
                        'bg-white p-8 rounded-lg shadow-md flex flex-col items-center space-x-4 space-y-4',
                },
                [
                    h('h1', { class: 'text-3xl font-bold mb-4' }, [text('Server Counter')]),
                    h('span', { class: 'text-5xl font-semibold text-gray-800"' }, [
                        text(`${state.count}`),
                    ]),
                    h(
                        'button',
                        {
                            class:
                                'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-2xl',
                            onclick: {
                                t: 'INC', p: {
                                    delta: 1,
                                    modifiers: `JS:document.getElementById("${modifiersId}").value || undefined`,
                                }
                            },
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
                            onclick: state.count > 0 ? { t: 'RESET' } : undefined,
                        },
                        [text('reset')]
                    ),
                    h('input', {
                        id: modifiersId,
                        type: 'text',
                        class: 'bg-gray-50 border border-gray-300',
                        style: 'text-align: center',
                        placeholder: 'Modifiers',
                        value: justReset ? '' : undefined,
                    }, []),
                ]
            ),
        ]),
    ];
}