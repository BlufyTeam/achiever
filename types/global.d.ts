export {};

declare global {
  interface ServiceWorkerGlobalScope {
    define?: (...args: any[]) => any;
  }

  // Tell TS that `self` refers to ServiceWorkerGlobalScope
  var self: ServiceWorkerGlobalScope;
}
