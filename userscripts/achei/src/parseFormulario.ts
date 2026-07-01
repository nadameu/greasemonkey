import { askDocument, parseNodeWithDocument, queryUnique } from './02_tools';

export const parseFormulario = askDocument
  .chain(queryUnique<HTMLFormElement>('form[name="formulario"]'))
  .chain(parseNodeWithDocument);
