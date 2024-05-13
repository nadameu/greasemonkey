import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'nadameu.com.br',
        match: [
          'https://seeu.pje.jus.br/seeu/processo.do',
          'https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*',
        ],
      },
      build: { fileName: 'seeu-switch.user.js' },
    }),
  ],
  esbuild: { charset: 'utf8' },
  build: { emptyOutDir: false, outDir: '../..', target: 'firefox102' },
});
