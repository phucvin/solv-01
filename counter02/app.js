import { h, text } from './../shared01.js';
import * as counter from './counter.js';

export function initState(cid) {
    return {
        cid,
        c1: { iid: 1, state: counter.initState(cid) },
        c2: { iid: 2, state: counter.initState(cid, { startCount: 2 }) },
    };
}

export function render(state, action, context) {
    return [
        h('head', {}, [
            h('title', {}, [text('Counter 02 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex flex-col space-y-4 items-center justify-center min-h-screen bg-gray-100" }, [
            ...counter.render(state.c1.state, action, context, { iid: state.c1.iid }),
            ...counter.render(state.c2.state, action, context, { iid: state.c2.iid }),
        ]),
    ];
}