/** Strip browser/Node globals so tests resemble Hermes in Expo Go (no Web Crypto). */
const g = globalThis;

function hide(key, { throwOnGet = false } = {}) {
  try {
    delete g[key];
  } catch {
    /* non-configurable */
  }
  if (!throwOnGet) return;
  try {
    Object.defineProperty(g, key, {
      configurable: true,
      enumerable: false,
      get() {
        throw new Error(`Property '${key}' doesn't exist`);
      },
    });
  } catch {
    try {
      Object.defineProperty(g, key, {
        configurable: true,
        writable: true,
        value: undefined,
      });
    } catch {
      /* leave as-is */
    }
  }
}

hide("crypto", { throwOnGet: true });
for (const key of ["window", "document", "localStorage", "structuredClone"]) {
  hide(key);
}
