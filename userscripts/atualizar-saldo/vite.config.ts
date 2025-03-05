import { enderecosEproc } from '@nadameu/enderecos-eproc';
import target from '@nadameu/esbuild-target';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
    target,
  },
  esbuild: { charset: 'utf8' },
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': 'Atualizar saldos' },
        namespace: 'http://nadameu.com.br',
        match: [
          ...enderecosEproc('acao=processo_precatorio_rpv&*'),
          ...enderecosEproc('acao=processo_selecionar&*'),
          ...enderecosEproc('acao=processo_depositos_judiciais&*'),
        ],
      },
      build: {
        externalGlobals: {
          preact: cdn.unpkg('preact', 'dist/preact.min.js'),
        },
        fileName: 'atualizar-saldo.user.js',
      },
    }),
  ],
});
