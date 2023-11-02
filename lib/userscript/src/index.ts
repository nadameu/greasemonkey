#!/usr/bin/env node -r esbuild-register

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as esbuild from 'esbuild';
import * as p from '@nadameu/predicates';

main().catch(err => {
  console.error(err);
  process.exit(1);
});

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length !== 1) help();
  const [command] = argv as [string];
  if (command === 'build') {
  } else if (command === 'init') {
  } else if (command === 'serve') {
  } else {
    help(`Unknown command: "${command}".`);
  }
  const jsonPath = path.join(process.cwd(), 'userscript.json');
  const jsonExists = await fs.promises.access(jsonPath, fs.constants.W_OK).then(
    () => true,
    () => false
  );
  if (!jsonExists && command !== 'init') {
    throw new Error(`${jsonPath} does not exist.`);
  }
  const isValidJson = p.hasShape({
    entry: p.isString,
    metadata: p.isString,
    outfile: p.isString,
  });
  type ValidJson = p.Static<typeof isValidJson>;
  if (command === 'init') {
    const defaults: ValidJson = {
      entry: 'src/index.ts',
      metadata: 'metadata.js',
      outfile: 'my-userscript.user.js',
    };
    let values: any = defaults;
    if (jsonExists) {
      let customData: any = {};
      try {
        customData = JSON.parse(
          await fs.promises.readFile(jsonPath, { encoding: 'utf-8' })
        );
      } catch (e) {
        // No usable data
      }
      values = { ...defaults, ...customData };
    }
    await fs.promises.writeFile(jsonPath, JSON.stringify(values));
    process.exit(0);
  }
  if (command === 'build') {
    let json: ValidJson;
    try {
      json = JSON.parse(
        await fs.promises.readFile(jsonPath, { encoding: 'utf-8' })
      );
      p.assert(isValidJson(json), 'Invalid JSON.');
    } catch (e) {
      const cause = e instanceof Error ? e : undefined;
      throw new Error('Invalid JSON.', { cause });
    }

    const banner = await fs.promises.readFile(json.metadata, {
      encoding: 'utf-8',
    });

    const result = await esbuild.build({
      banner: { js: banner },
      bundle: true,
      charset: 'utf8',
      define: { DEVELOPMENT: 'false' },
      entryPoints: [json.entry],
      format: 'esm',
      outfile: json.outfile,
      target: 'firefox102',
    });
    console.log('ok');
    process.exit(0);
  }
  if (command === 'serve') {
    let json: ValidJson;
    try {
      json = JSON.parse(
        await fs.promises.readFile(jsonPath, { encoding: 'utf-8' })
      );
      p.assert(isValidJson(json), 'Invalid JSON.');
    } catch (e) {
      const cause = e instanceof Error ? e : undefined;
      throw new Error('Invalid JSON.', { cause });
    }

    const banner = await fs.promises.readFile(json.metadata, {
      encoding: 'utf-8',
    });

    const ctx = await esbuild.context({
      banner: { js: banner },
      bundle: true,
      charset: 'utf8',
      define: { DEVELOPMENT: 'true' },
      entryPoints: [json.entry],
      format: 'esm',
      outfile: json.outfile,
      target: 'firefox102',
    });

    const result = await ctx.serve({
      host: 'localhost',
      onRequest(req) {
        console.log(
          'requested',
          req.path,
          '@',
          new Date(Date.now()).toLocaleTimeString()
        );
      },
    });
    const filename = path.basename(json.outfile);
    console.log(`Serving on http://${result.host}:${result.port}/${filename}`);
    console.log('Press Ctrl + C to stop.');

    process.stdin.setRawMode(true);
    process.stdin.on('data', buffer => {
      if (buffer[0] === 0x03) {
        ctx
          .cancel()
          .then(() => ctx.dispose())
          .then(() => process.exit(0));
      } else {
        console.log('Press Ctrl + C to stop.');
      }
    });
  }
}

function help(msg?: string) {
  if (msg) {
    console.log(`An error occurred: ${msg}\n`);
  }
  console.log(`Usage: userscript <command>

Commands:
    init  Create the userscript.json file.
    build Build the userscript.
    serve Compile the userscript and serve it to the browser.
`);
  process.exit(1);
}
