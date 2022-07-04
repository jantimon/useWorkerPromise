import { useEffect, useRef, useState } from "react";
import type {
  DoubleArgmumentFunction,
  SingleArgmumentFunction,
  WorkerFunctionLoader,
} from "./createWorkerFactory";

type UnwrapWorkerFunctionLoader<TWorker extends any> =
  TWorker extends WorkerFunctionLoader<infer U> ? U : TWorker;

type UnwrapWorkerFunctionResult<TWorker extends any> =
  UnwrapWorkerFunctionLoader<TWorker> extends SingleArgmumentFunction<
    any,
    infer TResult
  >
    ? TResult
    : TWorker;

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
export function useWorkerMemo<TArg, TResult>(
  workerLoader: WorkerFunctionLoader<SingleArgmumentFunction<TArg, TResult>>,
  input: TArg
): undefined | Awaited<TResult>;
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
  TFalsy extends false | null | undefined
>(
  workerLoader:
    | WorkerFunctionLoader<SingleArgmumentFunction<TArg, TResult>>
    | TFalsy,
  input: TArg
): Awaited<TResult> | TFalsy | undefined;
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
export function useWorkerMemo<TArg, TInit, TResult>(
  workerLoader: WorkerFunctionLoader<
    DoubleArgmumentFunction<TArg, TInit, TResult>
  >,
  input: TArg,
  init: TInit
): undefined | Awaited<TResult>;
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
  TFalsy extends false | null | undefined
>(
  workerLoader:
    | WorkerFunctionLoader<DoubleArgmumentFunction<TArg, TInit, TResult>>
    | TFalsy,
  input: TArg,
  init: TInit
): undefined | Awaited<TResult> | TFalsy;
export function useWorkerMemo<
  TArg,
  TInit,
  TWorkerFunctionLoader extends
    | WorkerFunctionLoader<
        | SingleArgmumentFunction<TArg, any>
        | DoubleArgmumentFunction<TArg, TInit, any>
      >
    | false
    | null
    | undefined
>(
  workerLoader: TWorkerFunctionLoader,
  input: TArg,
  init?: TInit
): undefined | UnwrapWorkerFunctionResult<TWorkerFunctionLoader> {
  const [result, setResult] = useState<
    undefined | UnwrapWorkerFunctionResult<TWorkerFunctionLoader>
  >();
  const ref = useRef<null | ((input: TArg, init: TInit | undefined) => void)>();
  // Start and stop the worker:
  useEffect(() => {
    if (!workerLoader) return;
    /**
     * a reference to setResult which will be unset during cleanup
     * to prevent updating the state after unmount
     */
    let setWorkerResult: (
      value?: UnwrapWorkerFunctionResult<TWorkerFunctionLoader>
    ) => void = setResult;
    // Boot webworker
    const worker = workerLoader();
    worker.onmessage = ({ data }) => setWorkerResult(data);
    // Abuse `ref` as unique id which will never match
    // for the first equality check
    let previousArgs: [input: TArg, init: TInit | undefined] = [
      ref,
      ref,
    ] as any;
    // create the worker bridge
    ref.current = (...args) => {
      worker.postMessage(
        args.map((arg, i) => arg === previousArgs[i] || [arg])
      );
      previousArgs = args;
    };
    return () => {
      // turn set state into a noop as this
      // effect is no longer running
      setWorkerResult = () => {};
      worker.terminate();
    };
  }, [workerLoader, init]);

  useEffect(() => {
    const fn = ref.current;
    if (fn) {
      fn(input, init);
    }
  }, [input, init]);

  return result;
}
