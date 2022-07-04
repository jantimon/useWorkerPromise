import { useState } from "react"
import { UseWorkerMemoDemo } from "./UseWorkerMemoDemo";

const demos = {
    UseWorkerMemoDemo,
} as const

export const App = () => {
    const [demo, setDemo] = useState<keyof typeof demos>();
    if (demo) {
        const Demo = demos[demo];
        return <Demo />
    }
    return <>
        Choose a demo:
        {(Object.keys(demos) as Array<keyof typeof demos>).map((demoName) => <div key={demoName}>
            <button onClick={() => setDemo(demoName)}>{demoName}</button>
        </div>)}
       
    </>
}