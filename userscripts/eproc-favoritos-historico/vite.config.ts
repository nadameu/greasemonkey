import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import target from '@nadameu/esbuild-target';
import * as pkg from './package.json';
import { enderecosEproc } from '@nadameu/enderecos-eproc';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },

  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: [...enderecosEproc(`acao=processo_selecionar&*`)],
      },
    }),
  ],
});
