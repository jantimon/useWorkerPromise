import PromiseWorker from "promise-worker";
import { useEffect, useState } from "react";
import type {
  SingleArgmumentFunction,
  WorkerFunctionLoader,
} from "./createWorkerFactory.mjs";

const NO_VALUE = {};

type UnwrapWorkerFunctionLoader<TWorker extends any> =
  TWorker extends WorkerFunctionLoader<infer U> ? U : TWorker;

/**
 * useWorkerMemo uses a worker to computate a value and memorizes it
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
 *    const calculatedValue = useWorkerMemo(workerLoader, 42);
 *    return (
 *      <span>{calculatedValue}</span>
 *    );
 *  }
 * ```
 */
export function useWorkerMemo<
  TArg extends any,
  TWorkerFunctionLoader extends
  | WorkerFunctionLoader<SingleArgmumentFunction<TArg, any>>
  | false
  | null
  | undefined
>(workerLoader: TWorkerFunctionLoader, input: TArg) {
  type Runner = UnwrapWorkerFunctionLoader<TWorkerFunctionLoader>;
  const [result, setResult] =
    useState<
      Runner extends SingleArgmumentFunction<TArg, infer TResult>
      ? TResult
      : Runner
    >();
  const [ref] = useState<{ p: Promise<any>, r?: PromiseWorker }>({ p: Promise.resolve(NO_VALUE) });
  // Start and stop the worker:
  useEffect(() => {
    if (!workerLoader) return;
    const worker = workerLoader();
    ref.r ||= new PromiseWorker(worker);
    return () => {
      ref.r = undefined;
      worker.terminate();
    };
  }, [workerLoader]);
  // Run the worker
  useEffect(() => {
    const { r: promiseWorker } = ref;
    let isActive = true;
    if (!promiseWorker) return;
    // A worker is single threaded
    // to save time 
    // Wait for the previous worker computation
    ref.p = ref.p.then((previousResult): any =>
      // Verify that the component is still mounted
      // Verify that the value hasn't changed
      (!isActive ? previousResult :
      // Set the previous result while calculating the next value
      (previousResult !== NO_VALUE && setResult(previousResult)) ||
      // Start computation
      promiseWorker.postMessage(input).then((result) => 
      // Verify that the component is still mounted
      (isActive &&
        setResult(result)) || result
      )));
    return () => {
      isActive = false;
    };
  }, [input]);
  return result;
}
