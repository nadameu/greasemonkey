interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
  multipleSelect: {
    (): JQuery<HTMLElement>;
    defaults: MultipleSelectOptions;
  };
}

interface MultipleSelectOptions {
  name: '';
  isOpen: false;
  placeholder: '';
  selectAll: true;
  selectAllText: 'Selecionar todos';
  selectAllDelimiter: ['[', ']'];
  allSelected: 'Todos selecionados';
  minimumCountSelected: 3;
  countSelected: '# de % selecionados';
  noMatchesFound: 'Nenhum resultado encontrado';
  multiple: false;
  multipleWidth: 80;
  single: false;
  filter: false;
  width: undefined;
  maxHeight: 250;
  container: null;
  position: 'bottom';
  keepOpen: false;
  blockSeparator: '';
  displayValues: false;
  delimiter: ', ';
  styler(): false;
  textTemplate($elm: JQuery<HTMLElement>): string;
  onOpen(): false;
  onClose(): false;
  onCheckAll(): false;
  onUncheckAll(): false;
  onFocus(): false;
  onBlur(): false;
  onOptgroupClick(): false;
  onClick(): false;
}
