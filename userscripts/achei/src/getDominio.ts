const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as Record<'1' | '2' | '3' | '4', Dominio>;

declare const OpaqueSymbol: unique symbol;
declare class OpaqueClass<T> {
  private [OpaqueSymbol]: T;
}
type Opaque<T, U> = T & OpaqueClass<U>;

declare const DominioSymbol: unique symbol;
export type Dominio = Opaque<string, { [DominioSymbol]: never }>;

export function getDominio(doc: Document) {
  const value = doc.querySelector<HTMLInputElement>(
    'input[name="local"]:checked'
  )?.value;
  if (!value || !((k): k is keyof typeof dominios => k in dominios)(value)) {
    throw new Error('Não foi possível verificar o domínio.');
  }
  return dominios[value];
}
