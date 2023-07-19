import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
  },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        namespace: 'http://nadameu.com.br',
        include:
          /^https:\/\/eproc\.(?:jf(?:pr|rs|sc)|trf4)\.jus.br\/eproc(?:V2|2trf4)\/controlador\.php\?acao=(?:processo_selecionar|pessoa_consulta_integrada\/listar)&/,
      },
    }),
  ],
});
