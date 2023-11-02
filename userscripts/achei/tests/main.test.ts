import { describe, expect, MockedFunction, test, vitest } from 'vitest';
import { main } from '../src/main';

function createTest(
  name: string,
  fn: () => (
    result: PromiseSettledResult<void>,
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
    return Promise.allSettled([main({ doc: document, log })]).then(([x]) =>
      after(x, log)
    );
  });
}

describe('main', () => {
  createTest('sem local e sem formulario', () => {
    document.getElementsByName('local')[0]?.remove();
    document.getElementsByName('formulario')[0]?.remove();
    return (resultado, log) => {
      expect(resultado.status).toBe('rejected');
    };
  });
  createTest('sem local', () => {
    document.getElementsByName('local')[0]?.remove();

    return (resultado, log) => {
      expect(resultado.status).toBe('rejected');
    };
  });

  createTest('local com valor desconhecido', () => {
    const input = document.getElementsByName('local')[0] as HTMLInputElement;
    input.value = '999';

    return (resultado, log) => {
      expect(resultado.status).toBe('rejected');
    };
  });

  createTest('sem formulário', () => {
    document.getElementsByName('formulario')[0]?.remove();

    return (resultado, log) => {
      expect(resultado.status).toBe('rejected');
    };
  });

  createTest('nenhum nome', () => {
    return (resultado, log) => {
      expect(resultado.status).toBe('fulfilled');
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
      expect(resultado.status).toBe('fulfilled');
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
      expect(resultado.status).toBe('fulfilled');
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
      expect(resultado.status).toBe('fulfilled');
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
      expect(resultado.status).toBe('fulfilled');
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
        const local = document.getElementsByName(
          'local'
        )[0] as HTMLInputElement;
        local.value = value;
        const form = document.getElementsByName(
          'formulario'
        )[0] as HTMLFormElement;
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
          expect(resultado.status).toBe('fulfilled');
          expect(log).toHaveBeenCalledWith('2 links criados');
          expect(document.body).toMatchSnapshot();
        };
      });
    }
  });
});
