export function validarFormularioExterno(form: HTMLFormElement) {
  const camposEsperados = [
    'hdnInfraTipoPagina',
    'btnnovo',
    'btnVoltar',
    'txtValorSolicitacao',
    'txtDataPrestacao',
    'chkMotivo[]',
    'chkMotivo[]',
    'chkMotivo[]',
    'chkMotivo[]',
    'chkMotivo[]',
    'chkMotivo[]',
    'selTxtObservacao',
    'selTxtDecisao',
    'numPaginaAtual',
    'id_unica',
    'num_processo',
    'numeroNomeacao',
    'btnnovo',
    'btnVoltar',
  ];
  try {
    if (form.length !== camposEsperados.length) throw new Error();
    for (const [i, nomeEsperado] of camposEsperados.entries()) {
      const elt = form.elements[i];
      const nome =
        (elt && ('name' in elt ? (elt.name as string | undefined) : null)) ||
        elt?.id ||
        '';
      if (nome !== nomeEsperado) throw new Error();
    }
  } catch (_) {
    console.error('Campos do formulário não correspondem ao esperado.');
    return false;
  }
  return true;
}
