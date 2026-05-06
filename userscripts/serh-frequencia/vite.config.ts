import target from '@nadameu/esbuild-target';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },
  server: { hmr: false },
  plugins: [
    monkey({
      entry: 'src/index.ts',
      server: { prefix: name => `dev:${name}` },
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: [
          'https://serh.trf4.jus.br/controlador.php?acao=validacao_freq_servidor_pessoal_listar&*',
        ],
      },
    }),
  ],
});
