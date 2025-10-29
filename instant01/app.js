import { init, id } from "@instantdb/admin";

import { h, text } from './../shared01.js';
import * as Todo from './todo.js';

// InstantDB
const APP_ID = "1ca21621-df0d-4e36-a063-d6a230b491fe";
const db = init({
    appId: APP_ID,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

export function initState(context) {
    return {};
}

export async function render(state, action, context) {
    const ADD_TODO = 'ADD_TODO';

    switch (action?.t) {
        case ADD_TODO:
            await db.transact([db.tx.todos[id()].create({
                text: 'First one',
                done: false,
                createdAt: Date.now(),
            })]);
            break;
    }

    let todos = [];
    for (const todo of (await db.query({ todos: {} })).todos) {
        const props = {
            iid: todo.id,
            text: todo.text,
        };
        todos.push(...await Todo.render({}, action, context, props));
    }

    return [
        h('head', {}, [
            h('title', {}, [text('Instant 01 - Solv Prototype')]),
            h('script', { src: "https://cdn.tailwindcss.com" }, [text('')]),
        ]),
        h('body', { class: "flex flex-col space-y-4 items-center justify-center min-h-screen bg-gray-100" }, [
            h('div', { class: "space-y-4", }, todos),
            h('button', {
                class:
                    'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-2xl',
                onclick: { t: ADD_TODO },
            }, [text('Add Todo')]),
        ]),
    ];
}