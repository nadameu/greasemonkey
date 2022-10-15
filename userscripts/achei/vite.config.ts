import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const domains = ['centralrh.trf4.gov.br', 'serh.trf4.jus.br'] as const;
const protocols = ['http', 'https'] as const;
const extras = ['', '&*'] as const;
const include = domains.flatMap(domain =>
  protocols.flatMap(protocol =>
    extras.map(extra => `${protocol}://${domain}/achei/pesquisar.php?acao=pesquisar${extra}`)
  )
);

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../..',
    emptyOutDir: false,
    target: 'firefox91',
  },
  esbuild: { charset: 'utf8' },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Achei',
        namespace: 'http://nadameu.com.br/achei',
        include,
        version: '16.0.0',
      },
    }),
  ],
});
