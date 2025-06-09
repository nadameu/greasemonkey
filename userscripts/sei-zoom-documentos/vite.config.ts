import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';
import target from '@nadameu/esbuild-target';

function urls(acoes: string[]): string[] {
  return acoes.flatMap(acao => [
    `https://sei.trf4.jus.br/controlador.php?acao=${acao}&*`,
    `https://sei.trf4.jus.br/sei/controlador.php?acao=${acao}&*`,
  ]);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: urls(['arvore_visualizar', 'documento_visualizar']),
      },
    }),
  ],
  esbuild: { charset: 'utf8' },
  build: { emptyOutDir: false, outDir: '../../', target },
});
