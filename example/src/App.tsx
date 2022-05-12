import { useEffect, useState } from "react";
import { createWorkerFactory, useWorkerMemo, useWorkerPromise } from "use-worker-promise";

const workerLoader = createWorkerFactory<typeof import("./worker")["worker"]>(
  () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
);

export const App = () => {
  return <>
    <Demo1 />
    <br />
    <Demo2 />
  </>
}

const Demo1 = () => {
  const executeWorker = useWorkerPromise(workerLoader);
  const [value, setValue] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    let isRunning = true;
    executeWorker(value).then((result) => {
      if (!isRunning) {
        return;
      }
      setResult(result)
    });
    return () => {
      isRunning = false;
    }
  }, [value]);
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={({ target }) => setValue(target.value)}
      />
      {result}
    </>
  );
};

const Demo2 = () => {
  const [value, setValue] = useState("");
  const workerResult = useWorkerMemo(workerLoader, value);
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={({ target }) => setValue(target.value)}
      />
      {workerResult}
    </>
  );
};
