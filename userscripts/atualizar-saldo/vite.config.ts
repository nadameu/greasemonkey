import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import monkey, { cdn } from 'vite-plugin-monkey';

const urlInfo = ['pr', 'rs', 'sc']
  .map(uf => `eproc.jf${uf}.jus.br`)
  .map(domain => ({ domain, directory: 'eprocV2' }))
  .concat([{ domain: 'eproc.trf4.jus.br', directory: 'eproc2trf4' }]);

function buildUrl(acao: string) {
  return urlInfo.map(
    ({ domain, directory }) => `https://${domain}/${directory}/controlador.php?acao=${acao}&*`
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
    target: 'firefox91',
  },
  esbuild: { charset: 'utf8' },
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': 'Atualizar saldos' },
        namespace: 'http://nadameu.com.br',
        match: [
          ...buildUrl('processo_precatorio_rpv'),
          ...buildUrl('processo_selecionar'),
          ...buildUrl('processo_depositos_judiciais'),
        ],
      },
      build: {
        externalGlobals: {
          preact: cdn.unpkg('preact', 'dist/preact.min.js'),
        },
        fileName: 'atualizar-saldo.user.js',
      },
    }),
  ],
});
