import { h, text } from './../shared01.js';
import * as counter from './counter.js';

export function initState(context) {
    return {
        counterTitleNextNum: 3,
        counters: [
            { state: counter.initState({ startCount: 10 }), iid: context.nextIid(), titleNum: 1 },
            { state: counter.initState({ startCount: 20 }), iid: context.nextIid(), titleNum: 2 },
        ],
    };
}

export async function render(state, action, context) {
    const ADD_COUNTER = 'ADD_COUNTER';

    switch (action?.t) {
        case ADD_COUNTER:
            state.counters.push({
                state: counter.initState(),
                iid: context.nextIid(),
                titleNum: state.counterTitleNextNum++,
            });
            break;
    }

    let childCounters = [];
    for (const counterInfo of state.counters) {
        const props = { iid: counterInfo.iid, title: `Counter #${counterInfo.titleNum}` };
        childCounters.push(...await counter.render(counterInfo.state, action, context, props));
    }

    return [
        h('head', {}, [
            h('title', {}, [text('Counter 03 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex flex-col space-y-4 items-center justify-center min-h-screen bg-gray-100" }, [
            h('div', { class: "space-y-4", }, childCounters),
            h('button', {
                class:
                    'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-2xl',
                onclick: { t: ADD_COUNTER },
            }, [text('Add Counter')]),
        ]),
    ];
}