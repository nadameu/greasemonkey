import * as path from 'path';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript';
import { generateBanner } from './generateBanner';
import metadata from './metadata';
import pkg from './package.json';

const scriptFilename = `${pkg.name}.user.js`;

/** @type {import('rollup').RollupOptions} */
const config = {
  input: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    banner: generateBanner(metadata),
    file: path.resolve(__dirname, '..', scriptFilename),
    format: 'es',
  },
  plugins: [
    typescript(),
    process.env.BUILD === 'development' &&
    serve({
      contentBase: path.resolve(__dirname, '..'),
      open: true,
      openPage: `/${scriptFilename}`,
    }),
  ],
};

export default config;
