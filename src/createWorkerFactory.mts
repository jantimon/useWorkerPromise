export type SingleArgmumentFunction<TArg extends any, TResult extends any> = (
  arg: TArg
) => Promise<TResult>;
export type WorkerFunction<TWorker extends SingleArgmumentFunction<any, any>> =
  Worker & { __workerType?: TWorker };
export type WorkerFunctionLoader<
  TWorker extends SingleArgmumentFunction<any, any>
> = () => WorkerFunction<TWorker>;

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
