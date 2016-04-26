// ==UserScript==
// @name        SMWeb - edição de modelos e documentos
// @namespace   http://nadameu.com.br/smweb
// @include     https://smweb.trf4.jus.br/smweb/Ch/PesquisarModelosAR.aspx?modelo=*
// @include     https://smweb.trf4.jus.br/smweb/Mandado/EditarModeloMandado.aspx?cod=*
// @include     https://smweb.trf4.jus.br/smweb/Ch/EditarDocumentoAR.aspx
// @include     https://smweb.trf4.jus.br/smweb/Mandado/CorpoMandado.aspx?sdid=*
// @include     https://smweb.trf4.jus.br/smweb/Mandado/EditarMandadosEmBloco.aspx?idm=*
// @include     https://smweb.trf4.jus.br/smweb/Mandado/EditarMandado.aspx?idm=*
// @version     4
// @grant       none
// ==/UserScript==

var config = $('#ctl00_ContentPlaceHolder1_FCKeditor1___Config, #ctl00_ctl00_ContentPlaceHolder1_Corpo_editor___Config, #ctl00_conteudo_editor___Config')
config.val(config.val().replace('FontNames=Bookman Old Style&', 'FontNames=Arial;Bookman Old Style;Helvetica&').replace('&FormatSource=false&', '&FormatSource=true&') + '&EnterMode=div&FirefoxSpellChecker=true');

$('#ctl00_ContentPlaceHolder1_btnVoltar, #ctl00_ctl00_ContentPlaceHolder1_Titulo_btnVoltar, #ctl00_footer_btnFechar').parent().each(function() {
  $(this).append('<button id="btnCarta">Carta</button>');
  $('#btnCarta').on('click', function(e) {
    e.preventDefault();
    var ed = FCKeditorAPI.Instances.ctl00_ContentPlaceHolder1_FCKeditor1 || FCKeditorAPI.Instances.ctl00_ctl00_ContentPlaceHolder1_Corpo_editor || FCKeditorAPI.Instances.ctl00_conteudo_editor;
    var doc = ed.EditingArea.Document;
    Paragrafo.setFonte('Helvetica');
    Paragrafo.addEstilo('titulo', 'center', 12, ['strong']);
    Paragrafo.addEstilo('data', 'right', 12, ['strong']);
    Paragrafo.addEstilo('cabecalho', 'left', 12);
    Paragrafo.addEstilo('tratamento', 'center', 12);
    Paragrafo.addEstilo('linha', 'justify', 12);
    Paragrafo.addEstilo('texto', 'justify', 12);
    Paragrafo.addEstilo('assinatura', 'center', 12, ['strong', 'em']);
    Paragrafo.addEstilo('observacao', 'center', 12, ['em']);
    Linha.setEstilo('texto');
    $(doc.body).prepend([
      Paragrafo('titulo', 'CARTA DE #INTIMAÇÃO#'),
      Linha(),
      Paragrafo('cabecalho', '<strong>@+classe@ N&ordm; @processo@</strong>'),
      Paragrafo('cabecalho', '<strong>#AUTOR#:</strong> @+autores@'),
      Paragrafo('cabecalho', '<strong>#RÉU#:</strong> @+reus@'),
      Linha(),
      Paragrafo('tratamento', '#Prezado(a) Senhor(a)#:'),
      Linha(),
      Paragrafo('texto', '#Parágrafo 1#'),
      Paragrafo('texto', '#Parágrafo 2#'),
      Paragrafo('texto', '#Parágrafo 3#'),
      Linha(),
      Paragrafo('texto', '##e-Proc (chave só deve ser fornecida para as partes)## O inteiro teor do processo poderá ser consultado no endereço <em>http://eproc.jfpr.jus.br/</em>, opção &ldquo;Consulta Pública&rdquo;, &ldquo;Consulta Processo por Chave&rdquo;, informando o número do processo @processo@ e a chave @chaveprocessov2@.', 'Documento será recebido pela parte (e-Proc)'),
      Paragrafo('texto', '##Outros## O teor dos atos judiciais poderá ser consultado no endereço <em>http://www.jfpr.jus.br/</em>, opção &ldquo;Consulta Processual&rdquo;, informando o número do processo @processo@.', 'Documento será recebido por terceiros (e-Proc) ou é processo físico'),
      Linha(),
      Paragrafo('texto', 'Fica #Vossa Senhoria# ciente, ainda, de que este Juízo funciona na Rua Professor Becker, 2730, 1&ordm; andar, Santa Cruz, CEP 85015-230, Guarapuava/PR, telefone (42)&nbsp;3630-2250.'),
      Linha(),
      Paragrafo('texto', 'Guarapuava/PR, @-data@.'),
      Linha(),
      Linha(),
      Linha(),
      Paragrafo('observacao', 'assinado digitalmente'),
      Paragrafo('assinatura', '@+diretor@'),
      Paragrafo('assinatura', 'Diretor de Secretaria'),
      '<hr id="fim" />Tudo após esta linha será apagado.<br /><br /><br />'
    ].join('\n').replace(/#(#*[^#]+#*)#/g, '<span style="color: OrangeRed;">$1</span>'));
  });
});

var Paragrafo = (function(){
  var fontePadrao = 'Bookman Old Style';
  var alinhamentoPadrao = 'justify';
  var tamanhoPadrao = 12;
  var estilos = {};
  function Paragrafo(estilo, html) {
    var [alinhamento, tamanho, extraTags] = estilos[estilo];
    var partes = [
      '<div class="' + estilo + '" style="text-align: ' + alinhamento + ';">',
      '<span style="font-family: ' + fontePadrao + ';">',
      '<span style="font-size: ' + tamanho + 'pt;">'
    ];
    for (var i = 0, l = extraTags.length; i < l; ++i) partes.push('<' + extraTags[i] + '>');
    partes.push(html);
    for (var i = extraTags.length - 1; i > -1; --i) partes.push('</' + extraTags[i] + '>');
    partes = partes.concat([
      '</span>',
      '</span>',
      '</div>'
    ]);
    return partes.join('');
  }
  Paragrafo.setFonte = function(fonte) {
    fontePadrao = fonte;
  };
  Paragrafo.addEstilo = function(estilo, alinhamento = alinhamentoPadrao, tamanho = tamanhoPadrao, extraTags = []) {
    estilos[estilo] = [alinhamento, tamanho, extraTags];
  };
  return Paragrafo;
})();

var Linha = (function() {
  var estiloPadrao = null;
  function Linha() {
    return Paragrafo(estiloPadrao, '<br />');
  }
  Linha.setEstilo = function(estilo) {
    estiloPadrao = estilo;
  };
  return Linha;
})();

/*
 Formatação ideal:
 
<div style="text-align: justify;"><span style="font-family: Arial;"><span style="font-size: 11pt;"><strong>R&Eacute;U:</strong> @+reus@</span></span></div>
<div style="text-align: justify;"><span style="font-family: Arial;"><span style="font-size: 11pt;"><br /></span></span></div>

*/
