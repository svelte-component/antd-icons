import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// import sveltePreprocess from "svelte-preprocess";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [
    { file: pkg.module, format: "es" },
    { file: pkg.main, format: "umd", name: "ScAntdIcons" }
  ],

  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    svelte({
      // // enable run-time checks when not in production
      // dev: false,
      // // we'll extract any component CSS out into
      // // a separate file - better for performance
      // preprocess: sveltePreprocess({
      //   postcss: {
      //     plugins: [require("postcss-import")]
      //   }
      // })
    }),
    resolve({
      browser: true,
      dedupe: ["svelte"]
    }),
    commonjs(),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    terser()
  ],
  watch: {
    clearScreen: false
  }
};
