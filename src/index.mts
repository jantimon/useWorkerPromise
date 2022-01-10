import PromiseWorker from "promise-worker";
import { useEffect, useState } from "react";

export type SingleArgmumentFunction<TArg extends any, TResult extends any> = (
  arg: TArg
) => Promise<TResult>;
export type WorkerFunction<TWorker extends SingleArgmumentFunction<any, any>> =
  Worker & { __workerType?: TWorker };
export type WorkerFunctionLoader<
  TWorker extends SingleArgmumentFunction<any, any>
> = () => WorkerFunction<TWorker>;

type UnwrapWorkerFunctionLoader<TWorker extends any> =
  TWorker extends WorkerFunctionLoader<infer U> ? U : TWorker;

/**
 * Create a Worker factory
 *
 * This function is only a type guard helper
 */
export const createWorkerFactory = <
  TWorker extends SingleArgmumentFunction<any, any>
>(
  loader: WorkerFunctionLoader<TWorker>
) => loader;

/**
 * useWorkerPromise loads a WebWorker and turns it into a loadable function
 *
 * If the worker argument is undefined / null the hook will wait for a valid loader
 *
 * @example
 * ```tsx
 *  const workerLoader = createWorkerFactory<import("./worker").MyWorker>(
 *    () => new Worker(new URL('./worker.ts', import.meta.url))
 *  );
 *
 *  const MyComponent = () => {
 *    const myWorker = useWorkerPromise(workerLoader);
 *    return (
 *      <button onClick={() => myWorker("foo").then((result) => console.log(result))}>
 *        start worker calculation
 *      </button>
 *  }
 * ```
 *
 */
export function useWorkerPromise<
  TWorkerFunctionLoader extends
    | WorkerFunctionLoader<SingleArgmumentFunction<any, any>>
    | false
    | null
    | undefined
>(workerLoader: TWorkerFunctionLoader) {
  const initialize = workerLoader
    ? () => {
        const worker = workerLoader();
        const promiseWorker = new PromiseWorker(worker);
        return {
          /**
           * Termination will free memory and prevent any
           * compution from beeing finished
           */
          t: () => worker.terminate(),
          /**
           * Promise Worker ensures that the webworker call
           * will always receive the matching return value
           */
          w: promiseWorker.postMessage.bind(
            promiseWorker
          ) as UnwrapWorkerFunctionLoader<TWorkerFunctionLoader>,
        };
      }
    : { w: workerLoader as UnwrapWorkerFunctionLoader<TWorkerFunctionLoader> };
  const [{ t: terminate, w: worker }, lazyInitialize] = useState<{
    t?: () => void;
    w: UnwrapWorkerFunctionLoader<TWorkerFunctionLoader>;
  }>(initialize);
  // whenever terminate is set a webWorker is running.
  //
  // if a webWorker is running but the workerLoader is no longer set
  // -> terminate the webWorker and update the state
  //
  // if a webWorker is not running but the workerLoader is
  // -> launch the webworker and update the state
  useEffect(() => {
    if (!terminate !== !workerLoader) {
      lazyInitialize(initialize);
    }
    return terminate;
  }, [workerLoader, terminate]);
  return worker;
}
