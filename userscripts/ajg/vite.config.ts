import { enderecosEproc } from '@nadameu/enderecos-eproc';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import target from '@nadameu/esbuild-target';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Solicitações de pagamento em bloco',
        namespace: 'http://nadameu.com.br/ajg',
        match: enderecosEproc('acao=nomeacoes_ajg_listar&*'),
      },
    }),
  ],
});
