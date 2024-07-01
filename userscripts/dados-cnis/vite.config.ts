import { enderecosEproc } from '@nadameu/enderecos-eproc';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
    target: 'firefox102',
  },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        namespace: 'http://nadameu.com.br',
        match: [
          ...[
            'processo_selecionar',
            'pessoa_consulta_integrada/listar',
          ].flatMap(acao => enderecosEproc(`acao=${acao}&*`)),
          /abcd/,
        ],
      },
    }),
  ],
});
