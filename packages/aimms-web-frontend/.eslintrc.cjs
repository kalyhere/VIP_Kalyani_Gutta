module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier",
    "airbnb",
    "plugin:storybook/recommended"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      typescript: {},
    },
  },
  rules: {
    quotes: ["warn", "double", { avoidEscape: true }],
    semi: ["error", "never"],
    "react/jsx-filename-extension": [
      1,
      { extensions: [".js", ".jsx", ".ts", ".tsx"] },
    ],
    "react/react-in-jsx-scope": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    // allow underscore in place of an unused var
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "prettier/prettier": "error",
    // Disable auto-fix rules that break JSX syntax
    "react/jsx-closing-bracket-location": "off",
    "react/function-component-definition": "off",
    "import/prefer-default-export": "off",
    "object-curly-newline": "off",
    "react/jsx-props-no-spreading": "off",
    "react/require-default-props": "off",
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": "warn",
    "no-console": "warn",
    // Warn about hardcoded hex colors - use theme.palette instead
    "no-restricted-syntax": [
      "warn",
      {
        selector: "Literal[value=/#[0-9A-Fa-f]{3,8}/]",
        message:
          "Avoid hardcoded hex colors. Use theme.palette values instead (e.g., theme.palette.primary.main). If this is a theme definition file, you can ignore this warning.",
      },
    ],
  },
}
