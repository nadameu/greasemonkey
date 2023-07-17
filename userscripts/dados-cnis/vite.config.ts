import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
  },
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        namespace: 'http://nadameu.com.br',
        match: [
          'https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*',
          'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*',
          'https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*',
          'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*',
        ],
      },
      build: {
        externalGlobals: {
          preact: cdn.jsdelivr('preact', 'dist/preact.min.js'),
        },
      },
    }),
  ],
});
