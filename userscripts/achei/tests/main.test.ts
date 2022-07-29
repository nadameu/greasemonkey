import { describe, expect, MockedFunction, test, vitest } from 'vitest';
import { main } from '../src/main';

type Result<a, b> = { isOk: true; value: a } | { isOk: false; reason: b };
function Ok<a, b = never>(value: a): Result<a, b> {
  return { isOk: true, value };
}
function Err<b, a = never>(reason: b): Result<a, b> {
  return { isOk: false, reason };
}

function createTest(
  name: string,
  fn: () => (
    result: Result<unknown, unknown>,
    log: MockedFunction<{ (...args: any[]): void }>
  ) => void
) {
  return test(name, async () => {
    document.body.innerHTML = /* html */ `
<input type="radio" name="local" value="1" checked />
<form name="formulario"></form>
`;
    const after = fn();
    const log = vitest.fn();
    return main({ doc: document, log }).then(
      value => after(Ok(value), log),
      reason => after(Err(reason), log)
    );
  });
}

describe('main', () => {
  createTest('sem local', () => {
    document.getElementsByName('local')[0]?.remove();

    return (resultado, log) => {
      expect(resultado).toEqual(Err(new Error('Não foi possível verificar o domínio.')));
    };
  });

  createTest('local com valor desconhecido', () => {
    const input = document.getElementsByName('local')[0] as HTMLInputElement;
    input.value = '999';

    return (resultado, log) => {
      expect(resultado).toEqual(Err(new Error('Não foi possível verificar o domínio.')));
    };
  });

  createTest('sem formulário', () => {
    document.getElementsByName('formulario')[0]?.remove();

    return (resultado, log) => {
      expect(resultado).toEqual(Err(new Error('Não foi possível obter o formulário.')));
    };
  });

  createTest('nenhum nome', () => {
    return (resultado, log) => {
      expect(resultado).toEqual(Ok(void 0));
      expect(log).toHaveBeenCalledWith('0 link criado');
    };
  });

  createTest('um nome', () => {
    const form = document.getElementsByName('formulario')[0] as HTMLFormElement;
    form.insertAdjacentHTML(
      'afterend',
      /* html */ `<br>nonononon<br>nonononon<br>Sigla: ABC00<br>nonononon<br>nonononon<br>`
    );

    return (resultado, log) => {
      expect(resultado).toEqual(Ok(void 0));
      expect(log).toHaveBeenCalledWith('1 link criado');
      expect(document.body).toMatchSnapshot();
    };
  });

  createTest('dois nomes', () => {
    const form = document.getElementsByName('formulario')[0] as HTMLFormElement;
    form.insertAdjacentHTML(
      'afterend',
      /* html */ `<br>
nonononon<br>
nonononon<br>
Sigla: ABC00<br>
nonononon<br>
nonononon<br>
Sigla: bcd00 (antiga: bcd)<br>
nonononon<br>
nonononon<br>
`
    );

    return (resultado, log) => {
      expect(resultado).toEqual(Ok(void 0));
      expect(log).toHaveBeenCalledWith('2 links criados');
      expect(document.body).toMatchSnapshot();
    };
  });

  createTest('com tabela', () => {
    const form = document.getElementsByName('formulario')[0] as HTMLFormElement;
    form.insertAdjacentHTML(
      'afterend',
      /* html */ `<table><tr><td><br></td><td>
nonononon<br>
nonononon<br>
Sigla: ABC00<br>
nonononon<br>
nonononon<br>
Sigla: bcd00 (antiga: bcd)<br>
nonononon<br>
nonononon<br></td></tr></table>
`
    );

    return (resultado, log) => {
      expect(resultado).toEqual(Ok(void 0));
      expect(log).toHaveBeenCalledWith('2 links criados');
      expect(document.body).toMatchSnapshot();
    };
  });

  createTest('com tabela vazia', () => {
    const form = document.getElementsByName('formulario')[0] as HTMLFormElement;
    form.insertAdjacentHTML(
      'afterend',
      /* html */ `<table><tr><td><br></td></tr></table>
`
    );

    return (resultado, log) => {
      expect(resultado).toEqual(Ok(void 0));
      expect(log).toHaveBeenCalledWith('0 link criado');
      expect(document.body).toMatchSnapshot();
    };
  });

  describe('dominios', () => {
    createDominioTest('JFPR', '4');
    createDominioTest('JFRS', '2');
    createDominioTest('JFSC', '3');
    function createDominioTest(name: string, value: string) {
      createTest(name, () => {
        const local = document.getElementsByName('local')[0] as HTMLInputElement;
        local.value = value;
        const form = document.getElementsByName('formulario')[0] as HTMLFormElement;
        form.insertAdjacentHTML(
          'afterend',
          /* html */ `<table><tr><td><br></td><td>
nonononon<br>
nonononon<br>
Sigla: ABC00<br>
nonononon<br>
nonononon<br>
Sigla: bcd00 (antiga: bcd)<br>
nonononon<br>
nonononon<br></td></tr></table>
`
        );

        return (resultado, log) => {
          expect(resultado).toEqual(Ok(void 0));
          expect(log).toHaveBeenCalledWith('2 links criados');
          expect(document.body).toMatchSnapshot();
        };
      });
    }
  });
});
