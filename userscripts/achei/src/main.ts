import { ok } from './01_implementations';
import { askConsole } from './02_tools';
import { makeCriarLink } from './makeCriarLink';
import { parseDominio } from './parseDominio';
import { parseFormulario } from './parseFormulario';
import { parseNodeSiglas } from './parseNodeSiglas';

export const program = () => {
  const criarLink = parseDominio.chainParser(dom =>
    makeCriarLink(dom).mapReader(ok)
  );
  const nodeSiglas = parseFormulario.map(parseNodeSiglas);
  return nodeSiglas.chainParser(nodeSiglas =>
    criarLink.chainParser(criarLink => {
      for (const nodeSigla of nodeSiglas) {
        criarLink(nodeSigla);
      }
      const linksCriados = nodeSiglas.length;
      const s = linksCriados > 1 ? 's' : '';
      return askConsole
        .mapReader(c => c.log(`${linksCriados} link${s} criado${s}.`))
        .mapReader(ok);
    })
  );
};
