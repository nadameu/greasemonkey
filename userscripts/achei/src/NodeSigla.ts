import { NodeWithParent } from './02_tools';
import { Sigla } from './parseSigla';

export interface NodeSigla {
  node: NodeWithParent<Text>;
  sigla: Sigla;
}
