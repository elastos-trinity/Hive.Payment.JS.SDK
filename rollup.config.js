import { terser } from 'rollup-plugin-terser';
import json from "@rollup/plugin-json";

export default {
    // index.js and its dependencies
    input: './out-tsc/index.js',
    output: [
        // // normal build for readable index.js file
        // {
        //     file: 'dist/index.js',
        //     format: 'cjs'
        // },

        // minimize build by terser
        {
            file: 'dist/index.js',
            format: 'cjs',
            plugins: [terser()],
        },
    ],
    plugins: [json({compact: true})]
};
