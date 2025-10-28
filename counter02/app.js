import { h, text } from './../shared01.js';
import * as counter from './counter.js';

export function initState(cid) {
    return {
        cid,
        c1: counter.initState(cid, { count: 1 }),
        c2: counter.initState(cid, { count: 1 }),
    };
}

export function render(state, action, context) {
    return [
        h('head', {}, [
            h('title', {}, [text('Counter 02 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex items-center justify-center min-h-screen bg-gray-100" }, [
            ...counter.render(state.c1, action, context),
            ...counter.render(state.c2, action, context),
        ]),
    ];
}