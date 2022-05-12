import { expose } from 'use-worker-promise/register/index.mjs';

export const worker = expose(
    async (message: string) => {
        const start = Date.now() + Math.random() * 1000;
        console.log("Start", message);
        while (Date.now() <= start) {}
        console.log("End", message);
        return message.toUpperCase();
    });