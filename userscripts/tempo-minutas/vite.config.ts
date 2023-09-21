import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-br': 'Tempo nas minutas' },
        namespace: 'http://nadameu.com.br',
        match: ['pr', 'rs', 'sc']
          .map(uf => ({ dominio: `jf${uf}`, caminho: 'eprocV2' }))
          .concat([{ dominio: 'trf4', caminho: 'eproc2trf4' }])
          .map(
            ({ dominio, caminho }) =>
              `https://eproc.${dominio}.jus.br/${caminho}/controlador.php?acao=minuta_area_trabalho&*`
          ),
      },
    }),
  ],
});
