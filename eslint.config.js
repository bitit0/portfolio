import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint config. ESLint catches bugs (unused vars, accidental globals,
 * loose equality); Prettier owns formatting, and `eslint-config-prettier` turns
 * off every stylistic rule so the two never fight.
 */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "art-source/**", "public/**", "scripts view/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      // Diagnostic warnings for missing sprites/dialogue are intentional.
      "no-console": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "prefer-const": "warn",
      eqeqeq: ["warn", "smart"],
    },
  },

  // Build tooling and standalone scripts run in Node, not the browser.
  {
    files: ["*.config.js", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  prettier,
];
