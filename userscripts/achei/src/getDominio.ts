const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

export async function getDominio(doc: Document) {
  const value = doc.querySelector<HTMLInputElement>(
    'input[name="local"]:checked'
  )?.value;
  if (!value || !(value in dominios))
    throw new Error('Não foi possível verificar o domínio.');
  return dominios[value as keyof typeof dominios];
}
