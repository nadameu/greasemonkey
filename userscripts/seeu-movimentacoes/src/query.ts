import { DOMContext, Reader } from './Reader';
export const query = <T extends HTMLElement>(
  selector: string,
  context?: ParentNode
) =>
  Reader<DOMContext, string, T>(({ document }, Left, Right) => {
    const parent = context ?? document;
    const elt = parent.querySelector<T>(selector);
    if (!elt) return Left(`Elemento não encontrado: \`${selector}\`.`);
    return Right(elt);
  });
