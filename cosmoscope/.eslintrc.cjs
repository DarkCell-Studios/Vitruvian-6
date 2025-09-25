module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
  },
  ignorePatterns: [
    "dist",
    "coverage",
    "tailwind.config.ts",
    "playwright.config.ts",
    "vite.config.ts",
    "vitest.setup.ts",
    "tests/e2e/*",
  ],
};
