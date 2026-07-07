import { enderecosEproc } from '@nadameu/enderecos-eproc';
import target from '@nadameu/esbuild-target';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';
import { acoes } from './src/acoes';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },
  server: { hmr: false },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      server: { prefix: name => `dev:${name}` },
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: acoes.flatMap(acao => enderecosEproc(`acao=${acao}&*`)),
      },
    }),
  ],
});
