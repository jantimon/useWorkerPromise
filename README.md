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
npm install use-worker-promise
```

or

```
yarn add use-worker-promise
```

## Zero Config

Modern bundlers (Webpack, Vite, Parcel, ...) are capable of bundling Workers [out of the box](https://webpack.js.org/guides/web-workers/).  
Therefore `useWorkerPromise` and `useWorkerMemo` require **no plugin or loader**.

## Size

The `useWorkerPromise` hook minifies to ~270byte (min+gzip): 

```js
const o=new WeakMap;
function useWorkerPromise(n){const s=()=>n&&(t=>((t,r)=>{const n=o.get(t);if(n)return n;const s=r(),i=new e(s),c=[s,i.postMessage.bind(i)];return o.set(t,c),c})(i,n)[1](t)),[i,c]=r(s);return t((()=>c(s)),[n]),t((()=>()=>(e=>{const t=o.get(e);o.delete(e),t&&t[0].terminate()})(i)),[i]),i}
```

The `useWorkerMemo` hook minifies to ~300byte (min+gzip): 

```js
const o={},n=Promise.resolve(o);
function useWorkerMemo(s,i,p){const[m,c]=t(),[u]=t({p:n});return e((()=>{if(!s)return;const e=s(),t=new r(e);return u.r||(u.r=t.postMessage.bind(t)),u.p=n.then((()=>p&&u.r?u.r(p):o)),()=>{u.p=n,u.r=void 0,e.terminate()}}),[s,p]),e((()=>{const{r:r}=u;let e=!0;if(r)return u.p=u.p.then((r=>e&&u.r?r!==o&&c(r)||u.r(i).then((r=>e&&c(r)||r)):r)),()=>{e=!1}}),[i]),m}
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