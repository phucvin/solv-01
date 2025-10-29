import { init, id } from "@instantdb/admin";

import { h, text } from './../shared01.js';
import * as Todo from './todo.js';

// InstantDB
const APP_ID = "1ca21621-df0d-4e36-a063-d6a230b491fe";
const db = init({
    appId: APP_ID,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

export async function initState(context) {
    const todos = (await db.query({ todos: {} })).todos || [];
    return { todos };
}

function generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
}

export async function render(state, action, context) {
    const ADD_TODO = 'ADD_TODO';
    const REMOVE_ALL_TODO = 'REMOVE_ALL_TODO';

    let adding = false;
    let removingAll = false;
    switch (action?.t) {
        case ADD_TODO:
            const addAndQueryTodos = db.transact([
                db.tx.todos[id()].create({
                    text: generateRandomString(),
                    done: false,
                    createdAt: Date.now(),
                }),
            ])
                .then(() => db.query({ todos: {} }))
                .then(({ todos }) => { state.todos = todos; });
            context.addTask(ADD_TODO, addAndQueryTodos);
            adding = true;
            break;
        case REMOVE_ALL_TODO:
            const queryAndDelete = db.query({ todos: {} })
                .then(({ todos }) => db.transact(todos.map((t) => db.tx.todos[t.id].delete())))
                .then(() => db.query({ todos: {} }))
                .then(({ todos }) => { state.todos = todos; });
            context.addTask(REMOVE_ALL_TODO, queryAndDelete);
            removingAll = true;
            break;
        case 'SOLV_STREAMING':
            await context.getTaskIfAny(ADD_TODO);
            await context.getTaskIfAny(REMOVE_ALL_TODO);
    }

    let todos = [];
    if (!removingAll) {
        for (const todo of state.todos) {
            const props = {
                iid: todo.id,
                text: todo.text,
            };
            todos.push(...await Todo.render({}, action, context, props));
        }
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
            h('button', {
                class:
                    'text-white font-bold py-2 px-4 rounded-full text-2xl ' + (removingAll ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'),
                onclick: removingAll ? undefined : { t: REMOVE_ALL_TODO },
            }, [text(removingAll ? 'Removing All...' : 'Remove All')]),
        ]),
    ];
}