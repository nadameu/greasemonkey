import { enderecosEproc } from '@nadameu/enderecos-eproc';
import target from '@nadameu/esbuild-target';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        namespace: 'http://nadameu.com.br/baixa-acordo-inss',
        match: enderecosEproc('acao=processo_selecionar&*'),
      },
    }),
  ],
});
