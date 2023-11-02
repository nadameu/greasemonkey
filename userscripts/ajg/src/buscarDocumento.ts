export function buscarDocumento(
  url: string | URL,
  method: string = 'GET',
  data: Document | XMLHttpRequestBodyInit | null = null
) {
  return new Promise<Document>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'document';
    xhr.addEventListener('load', () => resolve(xhr.response));
    xhr.addEventListener('error', () =>
      reject(new Error(`Erro ao obter o documento "${url}".`))
    );
    xhr.send(data);
  });
}
