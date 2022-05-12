import PromiseWorker from "promise-worker";
import { useEffect, useState } from "react";
import type {
  SingleArgmumentFunction,
  WorkerFunctionLoader,
} from "./createWorkerFactory.mjs";

const workerMap = new WeakMap<
  SingleArgmumentFunction<any, any>,
  readonly [Worker, SingleArgmumentFunction<any, any>]
>();
const initialize = <TRunner extends SingleArgmumentFunction<any, any>>(
  runner: TRunner,
  workerLoader: WorkerFunctionLoader<TRunner>
) => {
  const workerStateFromMap = workerMap.get(runner);
  if (workerStateFromMap) {
    return workerStateFromMap as readonly [Worker, TRunner];
  }
  const worker = workerLoader();
  const promiseWorker = new PromiseWorker(worker);
  const workerState = [
    worker,
    promiseWorker.postMessage.bind(promiseWorker),
  ] as const;
  workerMap.set(runner, workerState);
  return workerState as readonly [Worker, TRunner];
};
const terminate = <TRunner extends SingleArgmumentFunction<any, any>>(
  runner: TRunner | null | undefined | false
) => {
  const worker = workerMap.get(runner as TRunner);
  workerMap.delete(runner as TRunner);
  worker && worker[0].terminate();
};

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
 *    );
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
  type Runner = TWorkerFunctionLoader extends WorkerFunctionLoader<
    infer TLoader
  >
    ? TLoader
    : TWorkerFunctionLoader;
  const createRunner = () =>
    (workerLoader as any) &&
    (((arg: any): Promise<any> =>
      initialize(
        run as any,
        workerLoader as WorkerFunctionLoader<SingleArgmumentFunction<any, any>>
      )[1](arg)) as Runner);
  const [run, setRunner] = useState<Runner>(createRunner);
  useEffect(() => setRunner(createRunner), [workerLoader]);
  useEffect(() => () => terminate(run), [run]);
  return run;
}
