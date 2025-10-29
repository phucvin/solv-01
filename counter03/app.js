import { h, text } from './../shared01.js';
import * as counter from './counter.js';

export function initState(context) {
    return {
        counters: [
            { state: counter.initState({ startCount: 10}), iid: context.nextIid() },
            { state: counter.initState({ startCount: 20}), iid: context.nextIid() },
        ],
    };
}

export async function render(state, action, context) {
    let childCounters = [];
    for (const counterInfo of state.counters) {
        childCounters.push(...await counter.render(counterInfo.state, action, context, { iid: counterInfo.iid }));
    }

    return [
        h('head', {}, [
            h('title', {}, [text('Counter 03 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex flex-col space-y-4 items-center justify-center min-h-screen bg-gray-100" }, childCounters),
    ];
}