import target from '@nadameu/esbuild-target';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: pkg.gm_name,
        namespace: 'http://nadameu.com.br/renajud',
        homepage: 'http://www.nadameu.com.br/',
        icon: 'https://github.com/nadameu/greasemonkey/raw/master/car.png',
        supportURL: 'https://github.com/nadameu/greasemonkey/issues',
        include:
          'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf',
      },
    }),
  ],
});
