import { askDocument, parseNodeWithDocument, queryUnique } from './02_tools';

export const parseFormulario = askDocument
  .mapReader(queryUnique<HTMLFormElement>('form[name="formulario"]'))
  .chain(parseNodeWithDocument);
