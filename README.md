# useWorkerPromise

A tiny and performant react hook for communicating with Web Workers. Post a message to the worker, get a message back. Wraps the tiny [promise-worker](https://www.npmjs.com/package/promise-worker) package.

## Goals

 - tiny and performant
 - no bundler loaders or plugins
 - typesafe worker code
 - easy to use
 - support for ssr

## Installation

```
npm install useWorkerPromise
```

or

```
yarn add useWorkerPromise
```

## Zero Config

Modern bundlers are capable of bundling Workers [out of the box](https://webpack.js.org/guides/web-workers/).  
Therefore `useWorkerPromise` requires **no plugin or loader**.

## Size

The `useWorkerPromise` hook itself minifies to less than 200byte: 

```
function(t){const e=t?()=>{const e=t(),n=new x(e);return{t:()=>e.terminate(),w:t=>n.postMessage(t)}}:{w:t},[{t:n,w:o},r]=y(e);return z(()=>(!n!=!t&&r(e),n),[t]),o}
```

The only dependency is the very lightweight [promise-worker](https://www.npmjs.com/package/promise-worker) package.

## Types

`useWorkerPromise` is fully typed and provides helpers to keep your worker typings in sync with your react application.

## Example

worker.ts
```tsx
import { expose } from 'use-worker-promise/register';

const worker = async (message: string) => {
  return message.toUpperCase();
};

export type WorkerFunction = typeof worker;
expose(worker);
```

App.tsx
```tsx
import { useEffect, useState } from "react"
import { createWorkerFactory, useWorkerPromise } from "use-worker-promise";

import type {WorkerFunction} from ("./worker");
const workerLoader = createWorkerFactory<WorkerFunction>(
    () => new Worker(new URL('./worker.ts', import.meta.url))
);

export const App = () => {
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

## SSR

`useWorkerPromise` supports SSR in two different ways: hybrid and only browser.

### Run the worker in NodeJs

For SSR you can use the [web-worker](https://www.npmjs.com/package/web-worker) npm package.

### Run the worker only in Browser

`useWorkerPromise` allows to conditionally execture the WebWorker by returning a falsy workerLoader:

```tsx
const workerLoader = typeof window !== "undefined" && 
  createWorkerFactory<WorkerFunction>(
     () => new Worker(new URL('./worker.ts', import.meta.url))
  );
```