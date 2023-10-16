import { ABA_DIVERSA, BOTAO_ADICIONADO, MESMO_JUIZO } from './ResultType';
import { main } from './main';
import * as pkg from '../package.json';

const HEADER = `<${pkg.gm_name}>`;
const MENSAGENS = {
  [ABA_DIVERSA]: 'Aba diversa.',
  [MESMO_JUIZO]: 'Mesmo juízo.',
  [BOTAO_ADICIONADO]: 'Botão adicionado.',
};
try {
  const result = main();
  switch (result) {
    case ABA_DIVERSA:
    case MESMO_JUIZO:
    case BOTAO_ADICIONADO:
      console.info(HEADER, MENSAGENS[result]);
      break;

    default:
      logarErro(new Error(`Resultado inesperado: ${JSON.stringify(result)}.`));
      break;
  }
} catch (err) {
  logarErro(err);
}

function logarErro(err: unknown) {
  console.group(HEADER);
  console.error(err);
  console.groupEnd();
}
