# useWorkerPromise

A tiny and performant react hook for communicating with Web Workers. Post a message to the worker, get a message back. Wraps the tiny [promise-worker](https://www.npmjs.com/package/promise-worker) package.

## Goals

 - tiny and performant
 - no bundler loaders or plugins
 - typesafe worker code
 - easy to use
 - support for ssr
 - support for concurrency mode

## Installation

```
npm install useWorkerPromise
```

or

```
yarn add useWorkerPromise
```

## Zero Config

Modern bundlers (Webpack, Vite, Parcel, ...) are capable of bundling Workers [out of the box](https://webpack.js.org/guides/web-workers/).  
Therefore `useWorkerPromise` and `useWorkerMemo` require **no plugin or loader**.

## Size

The `useWorkerPromise` hook itself minifies to ~300byte: 

```js
function useWorkerPromise(n){const s=()=>n&&(t=>((t,r)=>{const n=o.get(t);if(n)return n;const s=r(),i=new e(s),c=[s,i.postMessage.bind(i)];return o.set(t,c),c})(i,n)[1](t)),[i,c]=r(s);return t((()=>c(s)),[n]),t((()=>()=>(e=>{const t=o.get(e);o.delete(e),t&&t[0].terminate()})(i)),[i]),i}
```

The `useWorkerMemo` hook itself minifies to ~300byte: 

```js
function useWorkerMemo(n,s){const[i,m]=t(),[p]=t({p:Promise.resolve(o)});return e((()=>{if(!n)return;const e=n();return p.r||(p.r=new r(e)),()=>{p.r=void 0,e.terminate()}}),[n]),e((()=>{const{r:r}=p;let e=!0;if(r)return p.p=p.p.then((t=>e?t!==o&&m(t)||r.postMessage(s).then((r=>e&&m(r)||r)):t)),()=>{e=!1}}),[s]),i}
```

The only dependency is the very lightweight [promise-worker](https://www.npmjs.com/package/promise-worker) package.

## Types

`useWorkerPromise` and `useWorkerMemo` are fully typed and provides helpers to keep your worker typings in sync with your react application.

## Example

Try it live on [Glitch](https://glitch.com/edit/#!/zinc-acute-train)

worker.ts
```tsx
import { expose } from 'use-worker-promise/register';

export const worker = expose(async (message: string) => {
  return message.toUpperCase();
});
```

UseWorkerPromiseDemo.tsx
```tsx
import { useEffect, useState } from "react"
import { createWorkerFactory, useWorkerPromise } from "use-worker-promise";

const workerLoader = createWorkerFactory<import('./worker').worker>(
  () => new Worker(new URL('./worker.ts', import.meta.url), { type: "module" })
);

export const UseWorkerPromiseDemo = () => {
    const executeWorker = useWorkerPromise(workerLoader);

    return <button onClick={async () => {
        // This promise will be canceled on unmount automatically because of the worker termination:
        const result = await executeWorker("foo");
        console.log(result); // logs: "FOO"
    }}>
        run WebWorker
    </button>
}
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

## SSR

`useWorkerPromise` and `useWorkerMemo` support SSR in two different ways: `hybrid` and `browser only`.

### Run the worker in NodeJs

For SSR you can add the [web-worker](https://www.npmjs.com/package/web-worker) npm package.

### Run the worker only in Browser

`createWorkerFactory` allows to conditionally execture the WebWorker by returning a falsy workerLoader:

```tsx
const workerLoader = typeof window !== "undefined" && 
  createWorkerFactory<WorkerFunction>(
     () => new Worker(new URL('./worker.ts', import.meta.url))
  );
```