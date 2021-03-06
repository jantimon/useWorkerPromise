# useWorkerPromise

A tiny and performant react hook for communicating with Web Workers. Post a message to the worker, get a message back.

## Goals

 - tiny and performant
 - no bundler loaders or plugins
 - typesafe worker code
 - easy to use
 - support for ssr
 - support for concurrency mode
 - zero dependency

## Installation

```
npm install use-worker-promise
```

or

```
yarn add use-worker-promise
```

## Zero Config

Modern bundlers (Webpack, Vite, Parcel, ...) are capable of bundling Workers [out of the box](https://webpack.js.org/guides/web-workers/).  
Therefore `useWorkerMemo` requires **no plugin or loader**.

## Size

The `useWorkerMemo` hook minifies to [~300byte (min+gzip)](https://bundlejs.com/?q=use-worker-promise&treeshake=[{useWorkerMemo}]&config={%22esbuild%22:{%22external%22:[%22react%22,%22react-dom%22,%22promise-worker%22]}}):

```js
const s=e=>e;function a(s,a,o){const[n,c]=e(),u=t();return r((()=>{if(!s)return;let e=c;const t=s();t.onmessage=({data:t})=>e(t);let r=[u,u];return u.current=(...e)=>{t.postMessage(e.map(((e,t)=>e===r[t]||[e]))),r=e},()=>{e=()=>{},t.terminate()}}),[s,o]),r((()=>{const e=u.current;e&&e(a,o)}),[a,o]),n}export{s as createWorkerFactory,a as useWorkerMemo};
```

## Types

`useWorkerMemo` is fully typed and provides helpers to keep your worker typings in sync with your react application.

## Online Examples

- slow worker demo on [Glitch](https://glitch.com/edit/#!/zinc-acute-train)
- fuzzy worker search on [Glitch](https://glitch.com/edit/#!/fluffy-honored-gerbil)

## Usage

`useWorkerMemo` lazyloads and boots `worker.ts` in a seperate webworker process.
As soon as the worker is ready `useWorkerMemo` will execute the webworker with the given value.

Until the first result is available `useWorkerMemo` will return `undefined`.

worker.ts
```tsx
import { expose } from 'use-worker-promise/register';

export const worker = expose(
  (message: string) => message.toUpperCase()
);
```

UseWorkerMemoDemo.tsx
```tsx
import { useEffect, useState } from "react"
import { createWorkerFactory, useWorkerMemo } from "use-worker-promise";

const workerLoader = createWorkerFactory<import('./worker').worker>(
  () => new Worker(new URL('./worker.ts', import.meta.url), { type: "module" })
);

export const UseWorkerMemoDemo = () => {
  const [value, setValue] = useState("");
  const workerResult = useWorkerMemo(workerLoader, value);
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={({ target }) => setValue(target.value)}
      />
      {workerResult}
    </>
  );
}
```

## Worker Initialization

`useWorkerMemo` has an optional third argument to initialize the webworker.

The initialization value will be send only to the worker during boot.  
Afterwards a cache from memory is used to guarantee reference equality.

For example:

worker.ts
```tsx
import { expose } from 'use-worker-promise/register';

export const worker = expose(
  (message: string, options: { prefix : string}) => {
     return options.prefix + message.toUpperCase()
  }
);
```

```tsx
  // Changing the config argument will reboot the worker
  // therefore you should ensure that its value won't change
  // on every render
  const config = useMemo(() => {
    return {
      foo: 'baz'
    }
  }, []);
  useWorkerMemo(workerLoader, value, config);
```

## SSR

`useWorkerMemo` supports SSR in two different ways: `hybrid` and `browser only`.

### Run the worker in NodeJs

For SSR you can add the [web-worker](https://www.npmjs.com/package/web-worker) npm package.

### Run the worker only in Browser

`createWorkerFactory` allows to conditionally execute the WebWorker by returning a falsy workerLoader:

```tsx
const workerLoader = typeof window !== "undefined" && 
  createWorkerFactory<WorkerFunction>(
     () => new Worker(new URL('./worker.ts', import.meta.url), { type: "module" })
  );
```