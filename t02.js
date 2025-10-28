import http from 'http';

function assert(predicate, ...args) {
  if (!predicate) {
    console.error(...args);
    throw new Error('fatal');
  }
}

function eventName(str) {
  if (str.indexOf('on') == 0) {
    return str.slice(2).toLowerCase();
  }
  return null;
}

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

function text(content) {
  return { text: content };
}

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
    const r_prop_val = r.properties[prop];
    if (r_prop_val === undefined || r_prop_val === false) {
      remove.push(prop);
    }
  }

  for (const prop in r.properties) {
    const r_prop_val = r.properties[prop];
    if (r_prop_val === undefined || r_prop_val === false) {
      continue;
    }
    if (
      JSON.stringify(r_prop_val) !== JSON.stringify(l.properties[prop])
    ) {
      set[prop] = r_prop_val;
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

function ssr(vdom) {
  if (vdom.text != null) {
    return vdom.text;
  } else if (vdom.tag) {
    let properties = '';
    for (const prop in vdom.properties) {
      const prop_val = vdom.properties[prop];
      if (prop_val === undefined || prop_val === false) {
        continue;
      }
      const event = eventName(prop);
      if (event) {
        properties += ` ${prop}='dispatch(${JSON.stringify(prop_val)})'`;
      } else if (prop_val === true) {
        properties += ` ${prop}`;
      } else {
        properties += ` ${prop}="${prop_val}"`;
      }
    }
    if (vdom.children.length > 0) {
      let children = '';
      for (const child of vdom.children) {
        children += ssr(child);
      }
      return `<${vdom.tag}${properties}>${children}</${vdom.tag}>`;
    } else {
      return `<${vdom.tag}${properties}/>`;
    }
  } else {
    assert(false, 'unknown vdom type', vdom);
  }
}

function counter(state, action) {
  switch (action?.t) {
    case 'INC':
      state.count += action.p;
      break;
    case 'RESET':
      state.count = 0;
      break;
  }

  return h('div', {}, [
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
            onclick: { t: 'INC', p: 1 },
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
        h('input', { id: 'TODO#1', type: 'checkbox', checked: state.count >  0 }, []),
      ]
    ),
  ]);
}

let server_state = { count: 1 };
let server_vdom = counter(server_state);

function serve_app(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-100">
<div id='main'>${ssr(server_vdom)}</div>
</body>
<script>

function assert(predicate, ...args) {
  if (!predicate) {
    console.error(...args);
    throw new Error('fatal');
  }
}

function setProperty(prop, value, el) {
  if (value === true) {
    el.setAttribute(prop, "");
  } else {
    el.setAttribute(prop, value);
  }
  el[prop] = value;
}

function removeProperty(prop, el) {
  el.removeAttribute(prop);
  el[prop] = undefined;
}

function setListener(el, event, handle) {
  el.setAttribute('on' + event, 'dispatch(' + JSON.stringify(handle) + ')');
}

function eventName(str) {
  if (str.indexOf('on') == 0) {
    return str.slice(2).toLowerCase();
  }
  return null;
}

function create(vnode) {
  if (vnode.text !== undefined) {
    const el = document.createTextNode(vnode.text);
    return el;
  }

  const el = document.createElement(vnode.tag);

  for (const prop in vnode.properties) {
    const event = eventName(prop);
    const value = vnode.properties[prop];
    event === null
      ? setProperty(prop, value, el)
      : setListener(el, event, value);
  }

  for (const childVNode of vnode.children) {
    const child = create(childVNode);
    el.appendChild(child);
  }

  return el;
}

function modify(el, diff) {
  for (const prop of diff.remove) {
    const event = eventName(prop);
    if (event === null) {
      removeProperty(prop, el);
    } else {
      el.removeAttribute('on' + event);
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
  apply(el, diff.children);
}

function apply(el, childrenDiff) {
  const children = Array.from(el.childNodes);

  childrenDiff.forEach((diff, i) => {
    const action = Object.keys(diff)[0];
    switch (action) {
      case 'remove':
        children[i].remove();
        break;

      case 'modify':
        modify(children[i], diff.modify);
        break;

      case 'create': {
        assert(
          i >= children.length,
          'adding to the middle of children',
          i,
          children.length
        );
        const child = create(diff.create);
        el.appendChild(child);
        break;
      }

      case 'replace': {
        const child = create(diff.replace);
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

async function dispatch(data) {
  try {
    const res = await fetch('/action', { method: 'POST', body: JSON.stringify(data) });
    const diff = await res.json();
    apply(document.getElementById('main'), [diff]);
  } catch (error) {
    console.error('Error dispatching', error);
  }
}
</script>
</html>
`);
}

function serve_action(req, res) {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    data = JSON.parse(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const new_vdom = counter(server_state, data);
    res.end(JSON.stringify(diffOne(server_vdom, new_vdom)));
    server_vdom = new_vdom;
  });
}

const server = http.createServer((req, res) => {
  // Basic routing based on the request URL
  if (req.url === '/') {
    serve_app(req, res);
  } else if (req.url === '/action') {
    serve_action(req, res);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Page not found</h1>');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
