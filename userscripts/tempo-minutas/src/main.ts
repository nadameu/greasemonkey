export function main() {
  const divInfraBarraComandosSuperior = document.querySelectorAll(
    '[id="divInfraBarraComandosSuperior"]'
  );
  if (divInfraBarraComandosSuperior.length !== 1)
    throw new Error(`Erro ao obter elemento \`#divInfraBarraComandosSuperior\`.`);
}
