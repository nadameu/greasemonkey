import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

const paths = ['pr', 'rs', 'sc']
  .map(uf => `jf${uf}.jus.br/eprocV2`)
  .concat([`trf4.jus.br/eproc2trf4`]);
const match = ['listar', 'reativar'].flatMap(acao =>
  paths.map(
    part =>
      `https://eproc.${part}/controlador.php?acao=entidade_assistencial_${acao}&*`
  )
);

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match,
      },
    }),
  ],
});
