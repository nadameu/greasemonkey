import { GM } from '$';
import { ZipWriter } from '@zip.js/zip.js';
import { err, ok } from './Result';
import { queryUnique } from './Result/functions';
import classes from './area_de_trabalho.module.css';
import { lift_throwable } from './try_catch';

export function parseAreaDeTrabalho() {
  return ok(null).chain(() => {
    let imprimir: HTMLButtonElement;
    {
      const resultado = ok(document).chain(
        queryUnique<HTMLButtonElement>('button[id="btnImprimir"]')
      );
      if (!resultado.ok) return err(resultado.reason);
      else imprimir = resultado.value;
    }

    let tabela: HTMLTableElement;
    {
      const resultado = ok(document).chain(
        queryUnique<HTMLTableElement>('table[id="tabelaMinutas"]')
      );
      if (!resultado.ok) return err(resultado.reason);
      else tabela = resultado.value;
    }

    return ok(() => {
      const salvar = Object.assign(document.createElement('button'), {
        className: 'infraButton ' + classes.button,
        type: 'button',
        textContent: 'Fazer download das minutas selecionadas',
        disabled: true,
      });
      habilitar_botao_se_minutas_selecionadas();
      salvar.addEventListener(
        'click',
        lift_throwable(async () => {
          salvar.disabled = true;
          await GM.setValue('salvar', true);
          imprimir.click();
        })
      );
      imprimir.after(' ', salvar);
      tabela.addEventListener('click', () => {
        habilitar_botao_se_minutas_selecionadas();
      });
      window.addEventListener('message', async ({ data }) => {
        try {
          if (!(Array.isArray(data) && data.every(s => typeof s === 'string')))
            return;
          // Creates a TransformStream object, the zip content will be written in the
          // `writable` property.
          const zipFileStream = new TransformStream();
          // Creates a Promise object resolved to the zip content returned as a Blob
          // object retrieved from `zipFileStream.readable`.
          const zipFileBlobPromise = new Response(
            zipFileStream.readable
          ).blob();

          // Creates a ZipWriter object writing data into `zipFileStream.writable`, adds
          // the entry "hello.txt" containing the text "Hello world!" retrieved from
          // `helloWorldReadable`, and closes the writer.
          const zipWriter = new ZipWriter(zipFileStream.writable);
          for (const [i, minuta] of data.entries()) {
            await zipWriter.add(
              `minuta_${String(i + 1).padStart(3, '0')}.html`,
              new Blob([minuta]).stream()
            );
          }
          /*
          await Promise.all(
            data.map((minuta, i) =>
              zipWriter.add(
                `minuta_${String(i + 1).padStart(3, '0')}.html`,
                new Blob([minuta]).stream()
              )
            )
          );
          */
          await zipWriter.close();
          console.log('created');

          // Retrieves the Blob object containing the zip content into `zipFileBlob`.
          const zipFileBlob = await zipFileBlobPromise;

          if (window.confirm('Fazer download?')) {
            console.log('Mensagem recebida:', zipFileBlob);
            window.open(
              URL.createObjectURL(new File([zipFileBlob], 'minutas.zip'))
            );
          }
        } catch (err) {
          console.log(err);
        }
      });
      function habilitar_botao_se_minutas_selecionadas() {
        const selecionados = tabela.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]:checked'
        );
        salvar.disabled = selecionados.length === 0;
      }
    });
  });
}
