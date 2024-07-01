import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { enderecosEproc } from '@nadameu/enderecos-eproc';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target: 'firefox102' },
  esbuild: { charset: 'utf8' },
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': 'Separar em blocos' },
        namespace: 'http://nadameu.com.br',
        match: [
          'processo_selecionar',
          'localizador_processos_lista',
          'relatorio_geral_consultar',
        ].flatMap(acao => enderecosEproc(`acao=${acao}&*`)),
        description:
          'Permite a separação de processos em blocos para movimentação separada',
      },
      build: {
        externalGlobals: {
          'preact': [
            'preact',
            version =>
              `https://cdn.jsdelivr.net/combine/npm/preact@${version},npm/preact@${version}/hooks/dist/hooks.umd.js`,
          ],
          'preact/hooks': ['preactHooks'],
        },
      },
    }),
  ],
});
