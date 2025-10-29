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
    const TASK_ADD_TODO = 'TASK_ADD_TODO';

    let adding = false;
    switch (action?.t) {
        case ADD_TODO:
            context.addTask(TASK_ADD_TODO, db.transact([db.tx.todos[id()].create({
                text: 'First one',
                done: false,
                createdAt: Date.now(),
            })]));
            adding = true;
            break;
        case 'SOLV_STREAMING':
            await context.getTaskIfAny(TASK_ADD_TODO);
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
                    'text-white font-bold py-2 px-4 rounded-full text-2xl ' + (adding ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'),
                onclick: adding ? undefined : { t: ADD_TODO },
            }, [text(adding ? 'Adding...' : 'Add Todo')]),
        ]),
    ];
}