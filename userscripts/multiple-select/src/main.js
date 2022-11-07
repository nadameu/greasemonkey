let index = 0;
let pending = false;
let queue = [];
window.inicializarMultipleSelect = function (selName, sinExibeFiltro, sinMarcaTodos) {
  const selId = `#sel${selName}`;
  const $sel = $(selId);
  $sel.multipleSelect({
    filter: sinExibeFiltro == 'N' ? false : true,
    minimumCountSelected: 1,
    selectAll: sinMarcaTodos == 'N' ? false : true,
    onClick: function (dado) {
      if (dado.value == 'null' || dado.value == undefined || !dado.value) {
        $sel.multipleSelect('uncheckAll');
      }

      if (selName == 'TemasRepetitivos') {
        if (
          $('input[name="selectItemselTemasRepetitivos"][value="proc_sem_tema"]').is(':checked') ||
          (dado.value == 'proc_sem_tema' && dado.checked)
        ) {
          if (dado.value != 'proc_sem_tema') {
            alert("Desmarque a opção 'Processos sem Tema' antes de selecionar outra opção");
          }
          $('#selTemasRepetitivos').multipleSelect('uncheckAll');
          $('#selTemasRepetitivos').multipleSelect('setSelects', ['proc_sem_tema']);
        }
      }

      // Pedido 190915 - adiciona opção E/OU ao escolher os localizadores
      if (selName === 'LocalizadorPrincipal') {
        var strOpcaoSelecionadaLocalizador = $('input[name=tipoOperacaoLocalizador]:checked').val();
        var arr = $('#selLocalizadorPrincipal').multipleSelect('getSelects');

        // Se o filtro selecionado é E e foi marcada uma terceira opção remove-a
        if (strOpcaoSelecionadaLocalizador === 'E' && arr.length > 2) {
          for (var i = 0; i < arr.length; i++) {
            if (arr[i] === dado.value) {
              arr.splice(i, 1);
            }
          }

          $('#selLocalizadorPrincipal').multipleSelect('setSelects', arr);
        }
      }
    },
    onClose: function () {
      if (selName == 'TipoTemasRepetitivos' || selName == 'SituacaoTemasRepetitivos') {
        var url =
          'controlador_ajax.php?acao_ajax=montar_select_processo_paradigma_judicial&hash=81656d45940570760ffe42df4c8ec8df';
        atualizarOptionsMultipleSelect(
          'selTemasRepetitivos',
          {
            cod_tipo_processo_paradigma: $('#selTipoTemasRepetitivosSelecionados').val(),
            id_situacao_paradigma: $('#selSituacaoTemasRepetitivosSelecionados').val(),
          },
          url
        );
      }
    },
  });

  var strOptions = $(`#valueOptions${selName}`).val() || '';
  queue.push({
    len: strOptions.match(/value=/g)?.length ?? 0,
    run: () => {
      //carregar as options
      if (strOptions !== '') {
        $sel.append(strOptions).multipleSelect('refresh');
      }

      var strOptionsRecup = $(`#sel${selName}RecupSelecionados`).val() || '';
      if (strOptionsRecup != '') {
        $sel.multipleSelect('setSelects', strOptionsRecup.split(','));
      }
    },
  });

  if (index === 0) {
    queue.sort((a, b) => a.len - b.len);
  }

  run();

  //o select não é criado com o atributo 'multiple' para evitar deformidades de layout no carregamento da tela
  $sel.attr('multiple', '');
};

function run() {
  if (pending) return;
  pending = true;
  window.requestIdleCallback(callback);
}

function callback() {
  if (index < queue.length) {
    const f = queue[index++];
    console.time('a');
    f.run();
    console.timeEnd('a');
    pending = false;
    run();
  } else {
    console.log('reset');
    queue = [];
    index = 0;
  }
}
