export async function XHR(url: string) {
  return await new Promise<Document>((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'document';
    xhr.onload = () => res(xhr.response);
    xhr.onerror = rej;
    xhr.send(null);
  });
}
