import { enderecosEproc } from '@nadameu/enderecos-eproc';
import target from '@nadameu/esbuild-target';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import * as pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: '../..', emptyOutDir: false, target },
  esbuild: { charset: 'utf8' },

  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: { 'pt-BR': pkg.gm_name },
        namespace: 'http://nadameu.com.br',
        match: [
          ...enderecosEproc(
            `acao=relatorio_processo_carta_precatoria_listar&*`
          ),
          ...enderecosEproc(`acao=processo_selecionar&*`),
          `https://portaldeservicos.pdpj.jus.br/consulta`,
          `https://portaldeservicos.pdpj.jus.br/consulta/autosdigitais`,
        ],
      },
    }),
  ],
});
