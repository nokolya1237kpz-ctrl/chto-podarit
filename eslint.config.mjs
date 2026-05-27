import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: ["../*", "../../*", "../../../*", "../../../../*"],
            message: "Используйте path aliases вместо глубоких относительных импортов."
          },
          {
            group: ["@server/*"],
            message: "Проверьте, что @server/* импортируется только из server/API кода, а не из client UI."
          }
        ]
      }]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
