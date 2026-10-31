import { AsyncLocalStorage } from 'node:async_hooks';

// Drží aktuální request přes celé zpracování (i přes await), aby hlídání chyb
// vědělo, na jaké routě a u kterého uživatele console.error vznikl, aniž by
// se req musel předávat do každého catch bloku.
const storage = new AsyncLocalStorage();

export const requestContext = (req, res, next) => storage.run({ req }, next);

export const currentRequest = () => storage.getStore()?.req ?? null;
