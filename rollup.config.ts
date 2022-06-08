import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RollupOptions } from 'rollup';
import prettier from 'rollup-plugin-prettier';

async function createConfigs() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const dir = await fs.promises.opendir(path.join(__dirname, 'userscripts'));
  const configs = await fromAsyncIterable(dir).then(async dirents =>
    Promise.all(
      (
        await Promise.all(
          dirents.map(async dirent => {
            if (!dirent.isDirectory()) return [];
            const input = path.join(dir.path, dirent.name, 'src', 'index.ts');
            const metadata = path.join(dir.path, dirent.name, 'metadata.js');
            if ((await Promise.all([exists(input), exists(metadata)])).every(x => x)) {
              return [
                fs.promises.readFile(metadata, { encoding: 'utf-8' }).then(
                  (banner): RollupOptions => ({
                    input,
                    plugins: [
                      typescript(),
                      nodeResolve(),
                      commonjs(),
                      babel({ babelHelpers: 'bundled', comments: false }),
                      prettier({ parser: 'babel' }),
                    ],
                    output: {
                      banner,
                      file: path.join(__dirname, `${dirent.name}.user.js`),
                      format: 'es',
                    },
                  })
                ),
              ];
            }
            return [];
          })
        )
      ).flat()
    )
  );
  // await dir.close();
  return configs;
}
export default createConfigs();

function exists(path: fs.PathLike) {
  return fs.promises.access(path, fs.constants.F_OK).then(
    () => true,
    () => false
  );
}

async function fromAsyncIterable<T>(ai: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const result of ai) {
    results.push(result);
  }
  return results;
}
