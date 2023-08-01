import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const protocolos = ['http', 'https'];
const dominios = ['centralrh.trf4.gov.br', 'serh.trf4.jus.br'];
const sufixos = ['', '&*'];

// https://vitejs.dev/config/
export default defineConfig({
  build: { target: 'firefox102', outDir: '../..', emptyOutDir: false },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Achei',
        namespace: 'http://nadameu.com.br/achei',
        match: dominios.flatMap(dominio =>
          protocolos.flatMap(protocolo =>
            sufixos.map(
              sufixo => `${protocolo}://${dominio}/achei/pesquisar.php?acao=pesquisar${sufixo}`
            )
          )
        ),
      },
    }),
  ],
});
