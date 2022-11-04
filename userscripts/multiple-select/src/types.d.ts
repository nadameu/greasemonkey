declare function infraTrim<T extends string | null | undefined>(arg0: T): T;

interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
  multipleSelect: {
    (this: JQuery<HTMLSelectElement>): JQuery<HTMLElement>;
    (this: JQuery<HTMLSelectElement>, options: Partial<MultipleSelectOptions>): JQuery<HTMLElement>;
    (
      this: JQuery<HTMLSelectElement>,
      method: 'enable' | 'disable' | 'checkAll' | 'uncheckAll' | 'focus' | 'blur' | 'refresh'
    ): JQuery<HTMLSelectElement>;
    (this: JQuery<HTMLSelectElement>, method: 'getSelects', type: 'value' | 'text'): string[];
    (
      this: JQuery<HTMLSelectElement>,
      method: 'setSelects',
      values: string[]
    ): JQuery<HTMLSelectElement>;
    (
      this: JQuery<HTMLSelectElement>,
      options: Partial<MultipleSelectOptions>,
      method: 'enable' | 'disable' | 'checkAll' | 'uncheckAll' | 'focus' | 'blur' | 'refresh'
    ): JQuery<HTMLSelectElement>;
    (
      this: JQuery<HTMLSelectElement>,
      options: Partial<MultipleSelectOptions>,
      method: 'getSelects',
      type: 'value' | 'text'
    ): string[];
    (
      this: JQuery<HTMLSelectElement>,
      options: Partial<MultipleSelectOptions>,
      method: 'setSelects',
      values: string[]
    ): JQuery<HTMLSelectElement>;
    defaults: MultipleSelectOptions;
  };
}

interface MultipleSelectOptions {
  etcaetera?: string;
  filterAcceptOnEnter?: boolean;
  hideOptgroupCheckboxes?: boolean;
  name: '';
  isOpen: boolean;
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
  single: boolean;
  filter: false;
  width: undefined;
  maxHeight: 250;
  container: null;
  position: 'bottom';
  keepOpen: false;
  blockSeparator: '';
  displayValues: false;
  delimiter: ', ';
  styler(arg: string | number | string[] | undefined): string | false;
  textTemplate($elm: JQuery<HTMLElement>): string;
  onOpen(): false;
  onClose(): false;
  onCheckAll(): false;
  onUncheckAll(): false;
  onFocus(): false;
  onBlur(): false;
  onOptgroupClick(param: { label: string; checked: boolean; children: HTMLInputElement[] }): false;
  onClick(param: {
    label: string;
    value: string | number | string[] | undefined;
    checked: boolean;
  }): false;
}

interface Element {
  matches<K extends keyof HTMLElementTagNameMap>(key: K): this is HTMLElementTagNameMap[K];
}
