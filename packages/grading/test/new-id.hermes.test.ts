import assert from "node:assert/strict";
import test from "node:test";
import { newId } from "../../../apps/mobile/lib/id.ts";

test("newId works when Hermes has no crypto", () => {
  let cryptoThrows = false;
  try {
    void globalThis.crypto;
  } catch {
    cryptoThrows = true;
  }
  const missing = !cryptoThrows && globalThis.crypto == null;
  assert.ok(cryptoThrows || missing, "hermes-env must hide global crypto");

  const a = newId("demo");
  const b = newId("demo");
  assert.match(a, /^demo-/);
  assert.match(b, /^demo-/);
  assert.notEqual(a, b);
});
