import register from "promise-worker/register";
/**
 * Make this worker a promise-worker
 *
 * @param callback Callback function for processing the inbound data
 */
export function expose<TMessageIn = any, TMessageOut = any>(callback: (message: TMessageIn) => Promise<TMessageOut>): (message: TMessageIn) => Promise<TMessageOut> {
  register(callback);
  return callback;
}