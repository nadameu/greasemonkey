import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target: 'firefox102' },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      build: { fileName: `${pkg.name}.user.js` },
      entry: 'src/main.ts',
      userscript: {
        noframes: false,
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'nadameu.com.br',
        match: [
          'https://seeu.pje.jus.br/seeu/usuario/areaAtuacao.do?*',
          'https://seeu.pje.jus.br/seeu/historicoProcessosRecursos.do?actionType=listar',
        ],
      },
    }),
  ],
  server: { hmr: false },
});
