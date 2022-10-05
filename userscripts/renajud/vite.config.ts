import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target: 'firefox91' },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Renajud',
        icon: 'https://github.com/nadameu/greasemonkey/raw/master/car.png',
        namespace: 'http://nadameu.com.br/renajud',
        homepage: 'http://www.nadameu.com.br/',
        supportURL: 'https://github.com/nadameu/greasemonkey/issues',
        include: 'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf',
      },
    }),
  ],
});
