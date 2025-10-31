# Stateless Offline-capable LiveView (Solv) Prototype 01

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/phucvin/solv-01)

To run:
```
node index.js
```

TODOs:
- Support stable element (doesn't need diffing after created and until removed), which is good for long content (e.g. blog post).
- Use express for routing to multiple apps
- Start offline-capable using service worker intercepting fetch (refs: https://github.com/richardanaya/wasm-service, https://github.com/kjartanm/htmx-sw)
- Multi-page App (MPA)
- Use generator for render (like https://crank.js.org/)
- Signals for render
- Optimize vdom serde, potentialy zero-copy parsing
- Client can keep the state & vdom (patched with every diff sent from server) to send it back to the server if the server responded 'I lost your state & vdom' (e.g. removed from cache).
- Pre-recorded diff (refs: https://docs.kweb.io/book/events.html#immediate-events)

Notes:
- Cluster -> pm2 and npm cluster don't work on stackblitz
