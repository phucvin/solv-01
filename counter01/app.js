import { h, text } from './../shared01.js';

function getRandomInteger(min, max) {
    min = Math.ceil(min); // Ensure min is an integer
    max = Math.floor(max); // Ensure max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let serverTotalInc = 0;

export function initState() {
    return { count: getRandomInteger(0, 10) };
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
            serverTotalInc += action.p.delta * modifiers;
            break;
        case 'RESET':
            justReset = true;
            state.count = 0;
            break;
    }

    const testId = state.count > 5 ? context.nextId() : undefined;
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
                    id: testId,
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
                    h('h3', {}, [text(`Server's Total Inc: ${serverTotalInc}`)]),
                ]
            ),
        ]),
    ];
}