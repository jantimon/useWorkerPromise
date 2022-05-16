import PromiseWorker from "promise-worker";
import { useEffect, useState } from "react";
import type {
  SingleArgmumentFunction,
  WorkerFunctionLoader,
} from "./createWorkerFactory.mjs";

/** Unique NoValue Symbol */
const NO_VALUE = {};
const NOOP_PROMISE = Promise.resolve(NO_VALUE);

type UnwrapWorkerFunctionLoader<TWorker extends any> =
  TWorker extends WorkerFunctionLoader<infer U> ? U : TWorker;

type UnwrapWorkerFunctionResult<TWorker extends any> = UnwrapWorkerFunctionLoader<TWorker> extends SingleArgmumentFunction<any, infer TResult> ? TResult : TWorker;

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
  TArg,
  TResult,
  >(workerLoader: WorkerFunctionLoader<SingleArgmumentFunction<TArg, TResult>>, input: TArg): undefined | TResult
/**
 * useWorkerMemo uses a worker to computate a value and memorizes it
 *
 * If the worker argument is undefined / null the hook will wait for a valid loader
 *
 * @example
 * ```tsx
 *  const workerLoader = typeof window !== "undefined" && createWorkerFactory<import("./worker").MyWorker>(
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
  TArg,
  TResult,
  >(workerLoader: WorkerFunctionLoader<SingleArgmumentFunction<TArg, TResult>> | false
    | null
    | undefined, input: TArg): undefined | TResult | false
  | null
/**
 * useWorkerMemo uses a worker to computate a value and memorizes it
 *
 * If the worker argument is undefined / null the hook will wait for a valid loader
 * 
 * The init argument will be passed to initialize the worker
 *
 * @example
 * ```tsx
 *  const workerLoader = typeof window !== "undefined" && createWorkerFactory<import("./worker").MyWorker>(
 *    () => new Worker(new URL('./worker.ts', import.meta.url))
 *  );
 *
 *  // The worker will be called with the given payload initialy
 *  const workerConfig = { foo: 'baz' };
 *  
 *  const MyComponent = () => {
 *    const calculatedValue = useWorkerMemo(workerLoader, 42, workerConfig);
 *    return (
 *      <span>{calculatedValue}</span>
 *    );
 *  }
 * ```
 */
export function useWorkerMemo<
  TArg,
  TInit,
  TResult,
  >(workerLoader: WorkerFunctionLoader<SingleArgmumentFunction<TArg, TResult>> | false
    | null
    | undefined, input: TArg, init: TInit): undefined | TResult | false
  | null
/**
 * useWorkerMemo uses a worker to computate a value and memorizes it
 *
 * If the worker argument is undefined / null the hook will wait for a valid loader
 * 
 * The init argument will be passed to initialize the worker
 *
 * @example
 * ```tsx
 *  const workerLoader = createWorkerFactory<import("./worker").MyWorker>(
 *    () => new Worker(new URL('./worker.ts', import.meta.url))
 *  );
 *
 *  // The worker will be called with the given payload initialy
 *  const workerConfig = { foo: 'baz' };
 *  
 *  const MyComponent = () => {
 *    const calculatedValue = useWorkerMemo(workerLoader, 42, workerConfig);
 *    return (
 *      <span>{calculatedValue}</span>
 *    );
 *  }
 * ```
 */
export function useWorkerMemo<
  TArg,
  TInit,
  TResult,
  >(workerLoader: WorkerFunctionLoader<SingleArgmumentFunction<TArg | TInit, TResult>> | false
    | null
    | undefined, input: TArg, init: TInit): undefined | TResult | false
  | null
export function useWorkerMemo<
  TArg,
  TInit,
  TWorkerFunctionLoader extends
  | WorkerFunctionLoader<SingleArgmumentFunction<TArg | TInit, any>>
  | false
  | null
  | undefined
>(workerLoader: TWorkerFunctionLoader, input: TArg, init?: TInit): undefined | UnwrapWorkerFunctionResult<TWorkerFunctionLoader> {
  type Runner = UnwrapWorkerFunctionLoader<TWorkerFunctionLoader>;
  const [result, setResult] =
    useState<
      undefined | UnwrapWorkerFunctionResult<TWorkerFunctionLoader>
    >();
  const [ref] = useState<{ p: Promise<any>, r?: Runner }>({ p: NOOP_PROMISE });
  // Start and stop the worker:
  useEffect(() => {
    if (!workerLoader) return;
    const worker = workerLoader();
    const promiseWorker = new PromiseWorker(worker);
    ref.r ||= promiseWorker.postMessage.bind(promiseWorker) as Runner;
    // Initialize the worker if the optional initialize arg was passed
    ref.p = NOOP_PROMISE.then(() => init && ref.r ? ref.r(init) : NO_VALUE);
    return () => {
      ref.p = NOOP_PROMISE;
      ref.r = undefined;
      worker.terminate();
    };
  }, [workerLoader, init]);
  // Run the worker
  useEffect(() => {
    const { r: promiseWorker } = ref;
    let isActive = true;
    if (!promiseWorker) return;
    // A worker is single threaded and takes time to boot up
    // this queue will throttle the input values to ensure that
    // only the latest input is send to the worker
    ref.p = ref.p.then((previousResult): any =>
    // Verify that the component is still mounted
    // Verify that the value hasn't changed
    (!isActive || !ref.r ? previousResult :
      // Set the previous result while calculating the next value
      (previousResult !== NO_VALUE && setResult(previousResult)) ||
      // Start computation
      ref.r(input).then((result) =>
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
