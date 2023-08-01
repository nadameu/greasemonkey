import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target: 'firefox102' },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Solicitações de pagamento em bloco',
        namespace: 'http://nadameu.com.br/ajg',
        include: [
          /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=nomeacoes_ajg_listar&/,
        ],
      },
    }),
  ],
});
