import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target: 'firefox91' },
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': 'Separar em blocos' },
        namespace: 'http://nadameu.com.br',
        match: [
          'https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*',
          'https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*',
          'https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*',
        ],
        description: 'Permite a separação de processos em blocos para movimentação separada',
      },
      build: {
        externalGlobals: {
          preact: cdn.jsdelivr('preact', 'dist/preact.min.js'),
        },
      },
    }),
  ],
});
