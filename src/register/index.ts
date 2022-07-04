/**
 * expose worker
 *
 * @param callback Callback function for processing the inbound data
 */
export function expose<A = any, TMessageOut = any>(callback: (input: A) => TMessageOut): (input: A) => TMessageOut
export function expose<A = any, TMessageOut = any>(callback: (input: A) => Promise<TMessageOut>): (input: A) => Promise<TMessageOut>
export function expose<A = any, B = any, TMessageOut = any>(callback: (input: A, options: B) => TMessageOut): (input: A, options: B) => TMessageOut
export function expose<A = any, B = any, TMessageOut = any>(callback: (input: A, options: B) => Promise<TMessageOut>): (input: A, options: B) => Promise<TMessageOut>
export function expose<A = any, B = any, TMessageOut = any>(callback: (input: A, options: B) => Promise<TMessageOut>): (input: A, options: B) => Promise<TMessageOut> {
  /** Cached args to allow sending only changed data and keep reference equality */
  let args: [A, B] = [] as any;
  /** Queued args */
  let nextArgs: MessageEventFormat<A, B> | undefined;
  /** True if a worker function is currently calculating */
  let isRunning = false;

  // Once Done trigger the next run
  const onDone = () => {
    isRunning = false;
    next();
  }

  // Throttle to allow skipping unneccessary runs
  let interval: ReturnType<typeof setTimeout>;
  const next = () => {
    clearInterval(interval);
    interval = setTimeout(() => {
      if(!isRunning && nextArgs) {
        executeCallback(nextArgs);
      } 
    });
  }

  const executeCallback = (data: MessageEventFormat<A, B>) => {
    isRunning = true;
    nextArgs = undefined;
    args = (data as MessageEventFormat<A, B>).map((arg, i) => arg === true ? args[i]: arg[0]) as [A,B];
    Promise.resolve().then(() => callback(...args)).then((result) => {
      self.postMessage(result);
      onDone()
    }, onDone);  
  };
  self.onmessage = async ({data}: MessageEvent) => {
    // if a calculation is ongoing queue the data
    // overwrites previously queued entries
    nextArgs = data; 
    next();
  }
  return callback;
}

export type MessageEventFormat<A,B> = [[A] | true, [B] | true]