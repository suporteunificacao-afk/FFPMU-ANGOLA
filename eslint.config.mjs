import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const filename = fileURLToPath(import.meta.url);
const compat = new FlatCompat({ baseDirectory: dirname(filename) });

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
