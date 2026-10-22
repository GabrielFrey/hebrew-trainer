/** Hermes (Expo Go) has no Web Crypto. Forbid bare crypto.randomUUID(). */
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["dist/**", ".expo/**", "node_modules/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='crypto'][callee.property.name='randomUUID']",
          message: "Hermes has no crypto. Use newId() from lib/id.ts (reads globalThis.crypto).",
        },
      ],
    },
  },
];
