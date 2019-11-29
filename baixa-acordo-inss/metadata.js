import pkg from './package.json';

export default {
  name: pkg.name,
  version: pkg.version,
  ...(pkg.description ? { description: pkg.description } : {}),
  namespace: 'http://nadameu.com.br/baixa-acordo-inss',
  match: ['https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*'],
  grant: 'none',
};
