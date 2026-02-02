const js = require("@eslint/js");
const globals = require("globals");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const importPlugin = require("eslint-plugin-import");

function sanitizeGlobals(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [String(k).trim(), v])
  );
}

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.node),
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // Repo conventions / pragmatism
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      // Start as warnings; tighten later once codebase is clean.
      "no-unused-vars": "warn",
      "react/jsx-key": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

