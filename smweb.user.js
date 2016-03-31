// ==UserScript==
// @name        SMWeb - edição de modelos AR
// @namespace   http://nadameu.com.br/smweb
// @include     https://smweb.trf4.jus.br/smweb/Ch/PesquisarModelosAR.aspx?modelo=*
// @version     1
// @grant       none
// ==/UserScript==

$('#ctl00_ContentPlaceHolder1_btnVoltar').parent().each(function() {
  $(this).append('<button id="btnAnalisar">Analisar</button>');
  $('#btnAnalisar').on('click', function(e) {
    e.preventDefault();
    var html = FCKeditorAPI.Instances.ctl00_ContentPlaceHolder1_FCKeditor1.GetHTML();
    console.debug(html);
    var data = '';
    html = html.replace(/</g, '{{');
    html = html.replace(/>/g, '}}');
    html = html.replace(/}}\s+{{>/g, '}}{{');
    html = html.replace(/{{/g, '<');
    html = html.replace(/}}/g, '>');
    /*
    html = doReplace('div', 'D', html);
    html = doReplace('p', 'P', html);
    html = doReplace('span', 'S', html);
    html = doReplace('strong', 'B', html);
    html = doReplace('b', 'B', html);
    html = doReplace('i', 'I', html);
    html = doReplace('em', 'I', html);
    html = html.replace(/<\/?br[^>]*>/g, '{{BR}}');
    html = html.replace(/{{\/D}}/g, '$&<br/>');
    */
    FCKeditorAPI.Instances.ctl00_ContentPlaceHolder1_FCKeditor1.SetHTML(html);
  });
});

function doReplace(tag, code, text) {
  var reOpen = new RegExp('<' + tag + '([^>]*)>', 'g');
  var reClose = new RegExp('</' + tag + '>', 'g');
  var temp = text.replace(reOpen, '{{' + code + ':$1}}');
  temp = temp.replace(reClose, '{{/' + code + '}}');
  return temp;
}

/*
 Formatação ideal:
 
<div style="text-align: justify;"><span style="font-family: Arial;"><span style="font-size: 11pt;"><strong>R&Eacute;U:</strong> @+reus@</span></span></div>
<div style="text-align: justify;"><span style="font-family: Arial;"><span style="font-size: 11pt;"><br /></span></span></div>

*/
