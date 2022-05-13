import {
  createWorkerFactory,
  useWorkerPromise,
} from "use-worker-promise";

const workerLoader = createWorkerFactory<typeof import("./worker")["worker"]>(
  () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
);

export const UseWorkerPromiseDemo = () => {
  const executeWorker = useWorkerPromise(workerLoader);

  return <button onClick={async () => {
      // This promise will be canceled on unmount automatically because of the worker termination:
      const result = await executeWorker("Demo");
      alert(result);
  }}>
      run WebWorker
  </button>
}
