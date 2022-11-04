import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: '../..',
    target: 'firefox91',
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        match: ['https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*'],
        namespace: 'http://nadameu.com.br',
      },
    }),
  ],
});
