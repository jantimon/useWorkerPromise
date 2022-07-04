export type SingleArgmumentFunction<TArg extends any, TResult extends any> = (
  arg: TArg
) => TResult;

export type DoubleArgmumentFunction<
  TArg extends any,
  TOptions extends any,
  TResult extends any
> = (arg: TArg, options: TOptions) => TResult;

export type WorkerFunction<TWorker extends (...args: any[]) => any> = Worker & {
  __workerType?: TWorker;
};

export type WorkerFunctionLoader<TWorker extends (...args: any[]) => any> =
  () => WorkerFunction<TWorker>;

/**
 * Create a Worker factory
 *
 * This function is only a type guard helper
 */
export const createWorkerFactory = <
  TWorker extends
    | SingleArgmumentFunction<any, any>
    | DoubleArgmumentFunction<any, any, any>
>(
  loader: WorkerFunctionLoader<TWorker>
): WorkerFunctionLoader<TWorker> => loader;
