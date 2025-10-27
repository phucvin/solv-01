// Copied from https://github.com/lazamar/smvc/blob/main/smvc.js
// See also https://lazamar.github.io/virtual-dom/

function assert(predicate, ...args) {
  if (!predicate) {
    console.error(...args);
    throw new Error('fatal');
  }
}

const props = new Set([
  'autoplay',
  'checked',
  'checked',
  'contentEditable',
  'controls',
  'default',
  'hidden',
  'loop',
  'selected',
  'spellcheck',
  'value',
  'id',
  'title',
  'accessKey',
  'dir',
  'dropzone',
  'lang',
  'src',
  'alt',
  'preload',
  'poster',
  'kind',
  'label',
  'srclang',
  'sandbox',
  'srcdoc',
  'type',
  'value',
  'accept',
  'placeholder',
  'acceptCharset',
  'action',
  'autocomplete',
  'enctype',
  'method',
  'name',
  'pattern',
  'htmlFor',
  'max',
  'min',
  'step',
  'wrap',
  'useMap',
  'shape',
  'coords',
  'align',
  'cite',
  'href',
  'target',
  'download',
  'download',
  'hreflang',
  'ping',
  'start',
  'headers',
  'scope',
  'span',
]);

function setProperty(prop, value, el) {
  if (props.has(prop)) {
    el[prop] = value;
  } else {
    el.setAttribute(prop, value);
  }
}

function listener(event) {
  const el = event.currentTarget;
  const handler = el._ui.listeners[event.type];
  const enqueue = el._ui.enqueue;
  assert(typeof enqueue == 'function', 'Invalid enqueue');
  const msg = handler;
  if (msg !== undefined) {
    enqueue(msg);
  }
}

function setListener(el, event, handle) {
  if (el._ui.listeners[event] === undefined) {
    el.addEventListener(event, listener);
  }

  el._ui.listeners[event] = handle;
}

function eventName(str) {
  if (str.indexOf('on') == 0) {
    return str.slice(2).toLowerCase();
  }
  return null;
}

// diff two virtual nodes
function diffOne(l, r) {
  const isText = l.text !== undefined;
  if (isText) {
    return l.text !== r.text ? { replace: r } : { noop: true };
  }

  if (l.tag !== r.tag) {
    return { replace: r };
  }

  const remove = [];
  const set = {};

  for (const prop in l.properties) {
    if (r.properties[prop] === undefined) {
      remove.push(prop);
    }
  }

  for (const prop in r.properties) {
    if (r.properties[prop] !== l.properties[prop]) {
      set[prop] = r.properties[prop];
    }
  }

  const children = diffList(l.children, r.children);
  const noChildrenChange = children.every((e) => e.noop);
  const noPropertyChange =
    remove.length === 0 && Array.from(Object.keys(set)).length == 0;

  return noChildrenChange && noPropertyChange
    ? { noop: true }
    : { modify: { remove, set, children } };
}

function diffList(ls, rs) {
  assert(rs instanceof Array, 'Expected an array, found', rs);
  const length = Math.max(ls.length, rs.length);
  return Array.from({ length }).map((_, i) =>
    ls[i] === undefined
      ? { create: rs[i] }
      : rs[i] == undefined
      ? { remove: true }
      : diffOne(ls[i], rs[i])
  );
}

function create(enqueue, vnode) {
  if (vnode.text !== undefined) {
    const el = document.createTextNode(vnode.text);
    return el;
  }

  const el = document.createElement(vnode.tag);
  el._ui = { listeners: {}, enqueue };

  for (const prop in vnode.properties) {
    const event = eventName(prop);
    const value = vnode.properties[prop];
    event === null
      ? setProperty(prop, value, el)
      : setListener(el, event, value);
  }

  for (const childVNode of vnode.children) {
    const child = create(enqueue, childVNode);
    el.appendChild(child);
  }

  return el;
}

function modify(el, enqueue, diff) {
  for (const prop of diff.remove) {
    const event = eventName(prop);
    if (event === null) {
      el.removeAttribute(prop);
    } else {
      el._ui.listeners[event] = undefined;
      el.removeEventListener(event, listener);
    }
  }

  for (const prop in diff.set) {
    const value = diff.set[prop];
    const event = eventName(prop);
    event === null
      ? setProperty(prop, value, el)
      : setListener(el, event, value);
  }

  assert(
    diff.children.length >= el.childNodes.length,
    'unmatched children lengths'
  );
  apply(el, enqueue, diff.children);
}

function apply(el, enqueue, childrenDiff) {
  const children = Array.from(el.childNodes);

  childrenDiff.forEach((diff, i) => {
    const action = Object.keys(diff)[0];
    switch (action) {
      case 'remove':
        children[i].remove();
        break;

      case 'modify':
        modify(children[i], enqueue, diff.modify);
        break;

      case 'create': {
        assert(
          i >= children.length,
          'adding to the middle of children',
          i,
          children.length
        );
        const child = create(enqueue, diff.create);
        el.appendChild(child);
        break;
      }

      case 'replace': {
        const child = create(enqueue, diff.replace);
        children[i].replaceWith(child);
        break;
      }

      case 'noop':
        break;

      default:
        throw new Error('Unexpected diff option: ' + Object.keys(diff));
    }
  });
}

// Create an HTML element description (a virtual node)
function h(tag, properties, children) {
  assert(typeof tag === 'string', 'Invalid tag value:', tag);
  assert(
    typeof properties === 'object',
    'Expected properties object. Found:',
    properties
  );
  assert(Array.isArray(children), 'Expected children array. Found:', children);
  return { tag, properties, children };
}

// Create a text element description (a virtual text node)
function text(content) {
  return { text: content };
}

function render(count) {
  return h('div', {}, [
    h('div', {}, [
      text('count = '),
      text(`${count}`),
      h('button', {}, [text('inc')]),
      count > 0 ? h('button', {}, [text('reset')]) : text(''),
    ]),
  ]);
}

console.log('t01');

const t1 = render(0);
console.log(JSON.stringify(t1, null, 2));
const t2 = render(1);
const d = diffOne(t1, t2);
console.log(JSON.stringify(d, null, 2));
