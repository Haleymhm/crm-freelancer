import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
    {
        rules: {
            // El proyecto carga datos en efectos de montaje. La regla nueva de
            // React Compiler lo marca como error; se mantiene como aviso para
            // no romper el lint mientras se migra a Server Components/fetching.
            "react-hooks/set-state-in-effect": "warn",
        },
    },
]);

export default eslintConfig;
