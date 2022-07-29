const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

export function getDominio(doc: Document) {
  const value = doc.querySelector<HTMLInputElement>('input[name="local"]:checked')?.value;
  if (!value) return null;
  if (!(value in dominios)) return null;
  return dominios[value as keyof typeof dominios];
}
