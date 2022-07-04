import { expose } from 'use-worker-promise/register';


export const worker = expose(
     (message: string, options: number) => {
        const start = Date.now() + 3000;
        console.log("Start", message, options);
        while (Date.now() <= start) {}
        console.log("End", message, options);
        return options + message.toUpperCase();
    });