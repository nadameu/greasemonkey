import { hasShape, Static } from '@nadameu/predicates';
import { isNumProc } from './NumProc';

export const isMensagem = hasShape({ processo_aberto: isNumProc });
export type Mensagem = Static<typeof isMensagem>;
