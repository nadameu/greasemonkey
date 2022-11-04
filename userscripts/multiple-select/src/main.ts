/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * @version 1.1.0
 *
 * http://wenzhixin.net.cn/p/multiple-select/
 */

export {};

jQuery(function ($) {
  class MultipleSelect {
    private $el: JQuery<HTMLSelectElement>;
    private options: MultipleSelectOptions;
    private $parent: JQuery<HTMLDivElement>;
    private $choice: JQuery<HTMLButtonElement>;
    private $drop: JQuery<HTMLDivElement>;
    private selectAllName: string;
    private selectGroupName: string;
    private selectItemName: string;
    private $searchInput?: JQuery<HTMLInputElement>;
    private $selectAll?: JQuery<HTMLInputElement>;
    private $selectGroups?: JQuery<HTMLInputElement>;
    private $selectItems?: JQuery<HTMLInputElement>;
    private $disableItems?: JQuery<HTMLInputElement>;
    private $noResults?: JQuery<HTMLElement>;
    constructor($el: JQuery<HTMLSelectElement>, options: MultipleSelectOptions) {
      const that = this;
      const name = $el.attr('name') || options.name || '';

      $el.parent().hide();
      let elWidth: number | string = $el.css('width');
      $el.parent().show();
      if (elWidth == '0px') {
        elWidth = $el.outerWidth()! + 20;
      }

      this.$el = $el.hide();
      this.options = options;
      this.$parent = $(
        `<div${(['class', 'title'] as const)
          .map(function (att) {
            let attValue = that.$el.attr(att) || '';
            attValue = (att === 'class' ? `ms-parent${attValue ? ' ' : ''}` : '') + attValue;
            return attValue ? ` ${att}="${attValue}"` : '';
          })
          .join('')} />`
      );
      this.$choice = $(
        `<button type="button" class="ms-choice"><span class="placeholder">${options.placeholder}</span><div></div></button>`
      );
      this.$drop = $(`<div class="ms-drop ${options.position}"></div>`);
      this.$el.after(this.$parent);
      this.$parent.append(this.$choice);
      this.$parent.append(this.$drop);

      if (this.$el.prop('disabled')) {
        this.$choice.addClass('disabled');
      }
      this.$parent.css('width', options.width || elWidth);

      if (!this.options.keepOpen) {
        $('body').on('click', function (e) {
          if (
            $(e.target)[0] === that.$choice[0] ||
            $(e.target).parents('.ms-choice')[0] === that.$choice[0]
          ) {
            return;
          }
          if (
            ($(e.target)[0] === that.$drop[0] ||
              $(e.target).parents('.ms-drop')[0] !== that.$drop[0]) &&
            that.options.isOpen
          ) {
            that.close();
          }
        });
      }

      this.selectAllName = `name="selectAll${name}"`;
      this.selectGroupName = `name="selectGroup${name}"`;
      this.selectItemName = `name="selectItem${name}"`;
    }

    init() {
      const that = this;
      const html = [];
      if (this.options.filter) {
        html.push(
          '<div class="ms-search">',
          '<input type="text" autocomplete="off" autocorrect="off" autocapitilize="off" spellcheck="false">',
          '</div>'
        );
      }
      html.push('<ul>');
      if (this.options.selectAll && !this.options.single) {
        html.push(
          '<li class="ms-select-all">',
          '<label>',
          `<input type="checkbox" ${this.selectAllName} /> `,
          `${this.options.selectAllDelimiter[0]}${this.options.selectAllText}${this.options.selectAllDelimiter[1]}`,
          '</label>',
          '</li>'
        );
      }
      $.each(this.$el.children(), function (i, elm) {
        html.push(that.optionToHtml(i, elm));
      });
      html.push(`<li class="ms-no-results">${this.options.noMatchesFound}</li>`);
      html.push('</ul>');
      this.$drop.html(html.join(''));

      this.$drop.find('ul').css('max-height', `${this.options.maxHeight}px`);
      this.$drop.find('.multiple').css('width', `${this.options.multipleWidth}px`);

      this.$searchInput = this.$drop.find<HTMLInputElement>('.ms-search input');
      this.$selectAll = this.$drop.find<HTMLInputElement>(`input[${this.selectAllName}]`);
      this.$selectGroups = this.$drop.find<HTMLInputElement>(`input[${this.selectGroupName}]`);
      this.$selectItems = this.$drop.find<HTMLInputElement>(
        `input[${this.selectItemName}]:enabled`
      );
      this.$disableItems = this.$drop.find<HTMLInputElement>(
        `input[${this.selectItemName}]:disabled`
      );
      this.$noResults = this.$drop.find('.ms-no-results');
      this.events();
      this.updateSelectAll(true);
      this.update(true);

      if (this.options.isOpen) {
        this.open();
      }
    }

    optionToHtml(i: number, elm: HTMLElement, group?: string, groupDisabled?: boolean) {
      const that = this;
      const $elm = $(elm);
      const html = [];
      const multiple = this.options.multiple;
      const optAttributesToCopy = ['class', 'title'];
      const clss = $.map(optAttributesToCopy, function (att) {
        const isMultiple = att === 'class' && multiple;
        const attValue = $elm.attr(att) || '';
        return isMultiple || attValue
          ? ` ${att}="${isMultiple ? `multiple${attValue ? ' ' : ''}` : ''}${attValue}"`
          : '';
      }).join('');
      let disabled: boolean;
      const type = this.options.single ? 'radio' : 'checkbox';

      if ($elm.is('option')) {
        const value = $elm.val();
        const text = that.options.textTemplate($elm);
        const selected =
          that.$el.attr('multiple') != undefined
            ? $elm.prop('selected')
            : $elm.attr('selected') == 'selected';
        const style = this.options.styler(value) ? ` style="${this.options.styler(value)}"` : '';

        disabled = groupDisabled || $elm.prop('disabled');
        if (this.options.blockSeparator > '' && this.options.blockSeparator == $elm.val()) {
          html.push(
            `<li${clss}${style}>`,
            `<label class="${this.options.blockSeparator}${disabled ? 'disabled' : ''}">`,
            text,
            '</label>',
            '</li>'
          );
        } else {
          html.push(
            `<li${clss}${style}>`,
            `<label${disabled ? ' class="disabled"' : ''}>`,
            `<input type="${type}" ${this.selectItemName} value="${value}"${
              selected ? ' checked="checked"' : ''
            }${disabled ? ' disabled="disabled"' : ''}${group ? ` data-group="${group}"` : ''}/> `,
            text,
            '</label>',
            '</li>'
          );
        }
      } else if (!group && $elm.is('optgroup')) {
        const _group = `group_${i}`,
          label = $elm.attr('label');

        disabled = $elm.prop('disabled');
        html.push(
          '<li class="group">',
          `<label class="optgroup${disabled ? ' disabled' : ''}" data-group="${_group}">`,
          this.options.hideOptgroupCheckboxes
            ? ''
            : `<input type="checkbox" ${this.selectGroupName}${
                disabled ? ' disabled="disabled"' : ''
              } /> `,
          label,
          '</label>',
          '</li>'
        );
        $.each($elm.children(), function (i, elm) {
          html.push(that.optionToHtml(i, elm, _group, disabled));
        });
      }
      return html.join('');
    }

    events() {
      const that = this;

      function toggleOpen(e: JQuery.ClickEvent) {
        e.preventDefault();
        that[that.options.isOpen ? 'close' : 'open']();
      }

      const label =
        this.$el.parent().closest('label')[0] || $(`label[for=${this.$el.attr('id')}]`)[0];
      if (label) {
        $(label)
          .off('click')
          .on('click', function (e) {
            if (e.target.nodeName.toLowerCase() !== 'label' || e.target !== this) {
              return;
            }
            toggleOpen(e);
            if (!that.options.filter || !that.options.isOpen) {
              that.focus();
            }
            e.stopPropagation(); // Causes lost focus otherwise
          });
      }
      this.$choice
        .off('click')
        .on('click', toggleOpen)
        .off('focus')
        .on('focus', this.options.onFocus)
        .off('blur')
        .on('blur', this.options.onBlur);

      this.$parent.off('keydown').on('keydown', function (e) {
        switch (e.which) {
          case 27: // esc key
            that.close();
            that.$choice.focus();
            break;
        }
      });
      this.$searchInput!.off('keydown')
        .on('keydown', function (e) {
          if (e.keyCode === 9 && e.shiftKey) {
            // Ensure shift-tab causes lost focus from filter as with clicking away
            that.close();
          }
        })
        .off('keyup')
        .on('keyup', function (e) {
          if (
            that.options.filterAcceptOnEnter &&
            (e.which === 13 || e.which == 32) && // enter or space
            that.$searchInput!.val() // Avoid selecting/deselecting if no choices made
          ) {
            that.$selectAll!.trigger('click');
            that.close();
            that.focus();
            return;
          }
          that.filter();
        });
      this.$selectAll!.off('click').on('click', function () {
        const checked = $(this).prop('checked');
        const $items = that.$selectItems!.filter(':visible');
        if ($items.length === that.$selectItems!.length) {
          that[checked ? 'checkAll' : 'uncheckAll']();
        } else {
          // when the filter option is true
          that.$selectGroups!.prop('checked', checked);
          $items.prop('checked', checked);
          that.options[checked ? 'onCheckAll' : 'onUncheckAll']();
          that.update();
        }
      });
      this.$selectGroups!.off('click').on('click', function () {
        const group = $(this).parent().attr('data-group'),
          $items = that.$selectItems!.filter(':visible'),
          $children = $items.filter(`[data-group="${group}"]`),
          checked = $children.length !== $children.filter(':checked').length;
        $children.prop('checked', checked);
        that.updateSelectAll();
        that.update();
        that.options.onOptgroupClick({
          label: $(this).parent().text(),
          checked: checked,
          children: $children.get(),
        });
      });
      this.$selectItems!.off('click').on('click', function () {
        that.updateSelectAll();
        that.update();
        that.updateOptGroupSelect();
        that.options.onClick({
          label: $(this).parent().text(),
          value: $(this).val(),
          checked: $(this).prop('checked'),
        });

        if (that.options.single && that.options.isOpen && !that.options.keepOpen) {
          that.close();
        }
      });
    }

    open() {
      if (this.$choice.hasClass('disabled')) {
        return;
      }
      this.options.isOpen = true;
      this.$choice.find('>div').addClass('open');
      this.$drop.show();

      // fix filter bug: no results show
      this.$selectAll!.parent().show();
      this.$noResults!.hide();

      // Fix #77: 'All selected' when no options
      if (this.$el.children().length === 0) {
        this.$selectAll!.parent().hide();
        this.$noResults!.show();
      }

      if (this.options.container) {
        const offset = this.$drop.offset();
        this.$drop.appendTo($(this.options.container));
        this.$drop.offset({ top: offset!.top, left: offset!.left });
      }
      if (this.options.filter) {
        this.$searchInput!.val('');
        this.$searchInput!.focus();
        this.filter();
      }
      this.options.onOpen();
    }

    close() {
      this.options.isOpen = false;
      this.$choice.find('>div').removeClass('open');
      this.$drop.hide();
      if (this.options.container) {
        this.$parent.append(this.$drop);
        this.$drop.css({
          top: 'auto',
          left: 'auto',
        });
      }
      this.options.onClose();
    }

    update(isInit?: unknown) {
      const selects = this.getSelects(),
        $span = this.$choice.find('>span');

      if (selects.length === 0) {
        $span.addClass('placeholder').html(this.options.placeholder);
      } else if (this.options.countSelected && selects.length < this.options.minimumCountSelected) {
        $span
          .removeClass('placeholder')
          .html(
            (this.options.displayValues ? selects : this.getSelects('text')).join(
              this.options.delimiter
            )
          );
      } else if (
        this.options.allSelected &&
        selects.length === this.$selectItems!.length + this.$disableItems!.length
      ) {
        $span.removeClass('placeholder').html(this.options.allSelected);
      } else if (
        (this.options.countSelected || this.options.etcaetera) &&
        selects.length > this.options.minimumCountSelected
      ) {
        if (this.options.etcaetera) {
          $span
            .removeClass('placeholder')
            .html(
              `${(this.options.displayValues
                ? selects
                : this.getSelects('text').slice(0, this.options.minimumCountSelected)
              ).join(this.options.delimiter)}...`
            );
        } else {
          $span
            .removeClass('placeholder')
            .html(
              this.options.countSelected
                .replace('#', String(selects.length))
                .replace('%', String(this.$selectItems!.length + this.$disableItems!.length))
            );
        }
      } else {
        $span
          .removeClass('placeholder')
          .html(
            (this.options.displayValues ? selects : this.getSelects('text')).join(
              this.options.delimiter
            )
          );
      }
      // set selects to select
      this.$el.val(this.getSelects());

      // add selected class to selected li
      this.$drop.find('li').removeClass('selected');
      this.$drop.find(`input[${this.selectItemName}]:checked`).each(function () {
        $(this).parents('li').first().addClass('selected');
      });

      // trigger <select> change event
      if (!isInit) {
        this.$el.trigger('change');
      }
    }

    updateSelectAll(Init?: unknown) {
      let $items = this.$selectItems!;
      if (!Init) {
        $items = $items.filter(':visible');
      }
      this.$selectAll!.prop(
        'checked',
        $items.length && $items.length === $items.filter(':checked').length
      );
      if (this.$selectAll!.prop('checked')) {
        this.options.onCheckAll();
      }
    }

    updateOptGroupSelect() {
      const $items = this.$selectItems!.filter(':visible');
      $.each(this.$selectGroups, function (i, val) {
        const group = $(val).parent().attr('data-group'),
          $children = $items.filter(`[data-group="${group}"]`);
        $(val).prop(
          'checked',
          $children.length && $children.length === $children.filter(':checked').length
        );
      });
    }

    /**
     * @param type "value" or "text", default: "value"
     */
    getSelects(type?: 'value' | 'text'): string[] {
      const that = this;
      let texts: string[] = [];
      const values: string[] = [];
      this.$drop.find<HTMLInputElement>(`input[${this.selectItemName}]:checked`).each(function () {
        texts.push(infraTrim($(this).parents('li').first().text()));
        values.push(infraTrim($(this).val() as string));
      });

      if (type === 'text' && this.$selectGroups!.length) {
        texts = [];
        this.$selectGroups!.each(function () {
          const html = [];
          const text = $.trim($(this).parent().text());
          const group = $(this).parent().data('group');
          const $children = that.$drop.find(`[${that.selectItemName}][data-group="${group}"]`);
          const $selected = $children.filter(':checked');

          if ($selected.length === 0) {
            return;
          }

          html.push('[');
          html.push(text);
          if ($children.length > $selected.length) {
            const list: string[] = [];
            $selected.each(function () {
              list.push($(this).parent().text());
            });
            html.push(`: ${list.join(', ')}`);
          }
          html.push(']');
          texts.push(html.join(''));
        });
      }
      return type === 'text' ? texts : values;
    }

    setSelects(values: string[]) {
      const that = this;
      this.$selectItems!.prop('checked', false);
      $.each(values, function (i, value) {
        that.$selectItems!.filter(`[value="${value}"]`).prop('checked', true);
      });
      this.$selectAll!.prop(
        'checked',
        this.$selectItems!.length === this.$selectItems!.filter(':checked').length
      );
      this.update();
    }

    enable() {
      this.$choice.removeClass('disabled');
    }

    disable() {
      this.$choice.addClass('disabled');
    }

    checkAll() {
      this.$selectItems!.prop('checked', true);
      this.$selectGroups!.prop('checked', true);
      this.$selectAll!.prop('checked', true);
      this.update();
      this.options.onCheckAll();
    }

    uncheckAll() {
      this.$selectItems!.prop('checked', false);
      this.$selectGroups!.prop('checked', false);
      this.$selectAll!.prop('checked', false);
      this.update();
      this.options.onUncheckAll();
    }

    focus() {
      this.$choice.trigger('focus');
      this.options.onFocus();
    }

    blur() {
      this.$choice.trigger('blur');
      this.options.onBlur();
    }

    refresh() {
      this.init();
    }

    filter() {
      const that = this,
        text = (this.$searchInput!.val() as string).trim().toLowerCase();
      if (text.length === 0) {
        this.$selectItems!.parent().show();
        this.$disableItems!.parent().show();
        this.$selectGroups!.parent().show();
      } else {
        this.$selectItems!.each(function () {
          const $parent = $(this).parent();
          $parent[$parent.text().toLowerCase().indexOf(text) < 0 ? 'hide' : 'show']();
        });
        this.$disableItems!.parent().hide();
        this.$selectGroups!.each(function () {
          const $parent = $(this).parent();
          const group = $parent.attr('data-group'),
            $items = that.$selectItems!.filter(':visible');
          $parent[$items.filter(`[data-group="${group}"]`).length === 0 ? 'hide' : 'show']();
        });

        //Check if no matches found
        if (this.$selectItems!.filter(':visible').length) {
          this.$selectAll!.parent().show();
          this.$noResults!.hide();
        } else {
          this.$selectAll!.parent().hide();
          this.$noResults!.show();
        }
      }
      this.updateOptGroupSelect();
      this.updateSelectAll();
    }
  }

  const multipleSelect: JQuery['multipleSelect'] = function (
    this: JQuery<HTMLSelectElement>,
    ...args:
      | []
      | [method: 'getSelects', type: 'value' | 'text']
      | [method: 'setSelects', values: string[]]
      | [method: 'enable' | 'disable' | 'checkAll' | 'uncheckAll' | 'focus' | 'blur' | 'refresh']
      | [options: Partial<MultipleSelectOptions>]
      | [options: Partial<MultipleSelectOptions>, method: 'getSelects', type: 'value' | 'text']
      | [options: Partial<MultipleSelectOptions>, method: 'setSelects', values: string[]]
      | [
          options: Partial<MultipleSelectOptions>,
          method: 'enable' | 'disable' | 'checkAll' | 'uncheckAll' | 'focus' | 'blur' | 'refresh'
        ]
  ): any {
    const allowedMethods = [
      'getSelects',
      'setSelects',
      'enable',
      'disable',
      'checkAll',
      'uncheckAll',
      'focus',
      'blur',
      'refresh',
    ] as const;

    function isAllowedMethod(x: string): x is typeof allowedMethods[number] {
      return allowedMethods.includes(x as any);
    }

    let value: string[] | undefined = undefined;
    for (const selectElement of this) {
      const $this = $(selectElement);
      let data: MultipleSelect | undefined = $this.data('multipleSelect');
      const userOptions = args.length > 0 && typeof args[0] === 'object' ? args[0] : {};
      const options: MultipleSelectOptions = Object.assign(
        {},
        $.fn.multipleSelect.defaults,
        $this.data() as Partial<MultipleSelectOptions>,
        userOptions
      );

      if (!data) {
        data = new MultipleSelect($this, options);
        $this.data('multipleSelect', data);
      }

      if (args.length === 0 || typeof args[0] === 'object') {
        data.init();
      }
      const methodInfo = ((): {
        method: string;
        args: any[];
      } | null => {
        if (args.length === 0) return null;
        if (typeof args[0] === 'string') {
          const [method, ...methodArgs] = args as Extract<typeof args, { 0: string }>;
          return { method, args: methodArgs };
        }
        if (args.length === 1) return null;
        const [, method, ...methodArgs] = args as Extract<typeof args, { 1: string }>;
        return { method, args: methodArgs };
      })();
      if (methodInfo) {
        if (!isAllowedMethod(methodInfo.method)) {
          throw `Unknown method: ${methodInfo.method}`;
        }
        value = (data[methodInfo.method] as Function)(...methodInfo.args);
      }
    }

    return value ? value : this;
  };

  function returnFalse(): false {
    return false;
  }

  multipleSelect.defaults = {
    name: '',
    isOpen: false,
    placeholder: '',
    selectAll: true,
    selectAllText: 'Selecionar todos',
    selectAllDelimiter: ['[', ']'],
    allSelected: 'Todos selecionados',
    minimumCountSelected: 3,
    countSelected: '# de % selecionados',
    noMatchesFound: 'Nenhum resultado encontrado',
    multiple: false,
    multipleWidth: 80,
    single: false,
    filter: false,
    width: undefined,
    maxHeight: 250,
    container: null,
    position: 'bottom',
    keepOpen: false,
    blockSeparator: '',
    displayValues: false,
    delimiter: ', ',

    styler: returnFalse,
    textTemplate($elm) {
      return $elm.text();
    },
    onOpen: returnFalse,
    onClose: returnFalse,
    onCheckAll: returnFalse,
    onUncheckAll: returnFalse,
    onFocus: returnFalse,
    onBlur: returnFalse,
    onOptgroupClick: returnFalse,
    onClick: returnFalse,
  };

  $.fn.multipleSelect = multipleSelect;
});
