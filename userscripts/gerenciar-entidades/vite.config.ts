import { enderecosEproc } from '@nadameu/enderecos-eproc';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: ['listar', 'reativar'].flatMap(acao =>
          enderecosEproc(`acao=entidade_assistencial_${acao}&*`)
        ),
      },
    }),
  ],
});
