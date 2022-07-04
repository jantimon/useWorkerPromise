import { useState } from "react";
import {
  createWorkerFactory,
  useWorkerMemo,
} from "use-worker-promise";

const workerLoader = createWorkerFactory<typeof import("./worker")["worker"]>(
  () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
);

export function UseWorkerMemoDemo() {
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState(4);
  
  const workerResult = useWorkerMemo(workerLoader, value, value2);


  return (
    <>
      <h1>use-worker-promise</h1>
      <br />
      <label onClick={()=> setValue2(value2 + 1)}>
        Input:
      <input
        type="text"
        placeholder="start typing"
        value={value}
        onChange={({ target }) => setValue(target.value)}
      />
        </label>
      <br />
      Result: {workerResult}
      <br /><br />
      Although the worker is intentionally slowed down for this demo the input field feels snappy.
    </>
  );
}
