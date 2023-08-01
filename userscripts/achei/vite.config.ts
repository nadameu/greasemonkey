import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const dominios = ['centralrh.trf4.gov.br', 'serh.trf4.jus.br'];
const protocolos = ['http', 'https'];
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
        match: zip3(
          dominios,
          protocolos,
          sufixos,
          (dominio, protocolo, sufixo) =>
            `${protocolo}://${dominio}/achei/pesquisar.php?acao=pesquisar${sufixo}`
        ),
      },
    }),
  ],
});

function apply<A, B>(fs: Array<(_: A) => B>, xs: A[]): B[] {
  return fs.flatMap(f => xs.map(x => f(x)));
}

function zip3<A, B, C, D>(as: A[], bs: B[], cs: C[], f: (a: A, b: B, c: C) => D): D[] {
  return apply(apply(as.map(curry3(f)), bs), cs);
}

function curry3<A, B, C, D>(f: (a: A, b: B, c: C) => D): (_: A) => (_: B) => (_: C) => D {
  return a => b => c => f(a, b, c);
}
