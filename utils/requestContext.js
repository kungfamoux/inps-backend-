const { AsyncLocalStorage } = require("async_hooks");

// Lets any log call anywhere in the async chain of a request (service,
// repository, anywhere) automatically pick up that request's id/method/path
// without threading them through every function signature.
const asyncLocalStorage = new AsyncLocalStorage();

const runWithContext = (context, callback) => asyncLocalStorage.run(context, callback);

const getContext = () => asyncLocalStorage.getStore();

module.exports = { runWithContext, getContext };
