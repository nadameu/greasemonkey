const regex_0 = /Sem Sigilo \(Nível (?<nivel>0)\)/;
const regex_1 = /Segredo de Justiça \(Nível (?<nivel>1)\)/;
const regex_234 = /Sigiloso \(Interno Nível (?<nivel>2|3|4)\)/;
const regex_5 = /Restrito Juiz \(Nível (?<nivel>5)\)/;
const regex = RegExp(
  `^(?:${[regex_0, regex_1, regex_234, regex_5].map(x => x.source).join('|')})$`
);
export function parse_nivel_sigilo(texto: string) {
  return texto.match(regex)?.groups?.nivel ?? null;
}
