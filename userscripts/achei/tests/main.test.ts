import { describe, expect, MockedFunction, test, vitest } from 'vitest';
import { main } from '../src/main';
import { h } from '@nadameu/create-element';

function reset_body() {
  document.body.innerHTML =
    '<input type="radio" name="local" value="1" checked><form name="formulario"></form>';
}

function createTest(
  name: string,
  fn: () => (
    result: PromiseSettledResult<void>,
    log: MockedFunction<{ (...args: any[]): void }>
  ) => void
) {
  return test(name, () => {
    reset_body();
    const after = fn();
    const log = vitest.fn();
    let result: PromiseSettledResult<void>;
    try {
      result = { status: 'fulfilled', value: main({ doc: document, log }) };
    } catch (reason) {
      result = { status: 'rejected', reason };
    }
    return after(result, log);
  });
}

createTest('sem local e sem formulario', () => {
  document.getElementsByName('local')[0]?.remove();
  document.getElementsByName('formulario')[0]?.remove();
  return (resultado, _log) => {
    expect(resultado.status).toBe('rejected');
  };
});
createTest('sem local', () => {
  document.body.append('Sigla: ABC00');
  document.getElementsByName('local')[0]?.remove();

  return (resultado, _log) => {
    expect(resultado.status).toBe('rejected');
  };
});

createTest('local com valor desconhecido', () => {
  document.body.append('Sigla: ABC00');
  const input = document.getElementsByName('local')[0] as HTMLInputElement;
  input.value = '999';

  return (resultado, _log) => {
    expect(resultado.status).toBe('rejected');
  };
});

createTest('sem formulário', () => {
  document.getElementsByName('formulario')[0]?.remove();

  return (resultado, _log) => {
    expect(resultado.status).toBe('rejected');
  };
});

createTest('nenhum nome', () => {
  return (resultado, log) => {
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('0 link criado.');
  };
});

createTest('texto vazio', () => {
  document.body.append('');

  return (resultado, log) => {
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('0 link criado.');
  };
});

createTest('um nome', () => {
  document.body.append(
    h('br'),
    'nonononon',
    h('br'),
    'nonononon',
    h('br'),
    'Sigla: ABC00',
    h('br'),
    'nonononon',
    h('br'),
    'nonononon',
    h('br')
  );
  return (resultado, log) => {
    if (resultado.status === 'rejected') throw resultado.reason;
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('1 link criado.');
    expect(document.body).toMatchSnapshot();
  };
});

createTest('dois nomes', () => {
  document.body.append(
    h('br'),
    'nonononon',
    h('br'),
    'nonononon',
    h('br'),
    'Sigla: ABC00',
    h('br'),
    'nonononon',
    h('br'),
    'nonononon',
    h('br'),
    'Sigla: bcd00 (antiga: bcd)',
    h('br'),
    'nonononon',
    h('br'),
    'nonononon',
    h('br')
  );

  return (resultado, log) => {
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('2 links criados.');
    expect(document.body).toMatchSnapshot();
  };
});

createTest('com tabela', () => {
  document.body.append(
    h(
      'table',
      {},
      h(
        'tbody',
        {},
        h(
          'tr',
          {},
          h('td', {}, h('br')),
          h(
            'td',
            {},
            'nonononon',
            h('br'),
            'nonononon',
            h('br'),
            'Sigla: ABC00',
            h('br'),
            'nonononon',
            h('br'),
            'nonononon',
            h('br'),
            'Sigla: bcd00 (antiga: bcd)',
            h('br'),
            'nonononon',
            h('br'),
            'nonononon',
            h('br')
          )
        )
      )
    )
  );

  return (resultado, log) => {
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('2 links criados.');
    expect(document.body).toMatchSnapshot();
  };
});

createTest('com tabela vazia', () => {
  document.body.append(
    h('table', {}, h('tbody', {}, h('tr', {}, h('td', {}, h('br')))))
  );

  return (resultado, log) => {
    expect(resultado.status).toBe('fulfilled');
    expect(log).toHaveBeenCalledWith('0 link criado.');
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
      document.body.append(
        h(
          'table',
          {},
          h(
            'tbody',
            {},
            h(
              'tr',
              {},
              h('td', {}, h('br')),
              h(
                'td',
                {},
                'nonononon',
                h('br'),
                'nonononon',
                h('br'),
                'Sigla: ABC00',
                h('br'),
                'nonononon',
                h('br'),
                'nonononon',
                h('br'),
                'Sigla: bcd00 (antiga: bcd)',
                h('br'),
                'nonononon',
                h('br'),
                'nonononon',
                h('br')
              )
            )
          )
        )
      );

      return (resultado, log) => {
        expect(resultado.status).toBe('fulfilled');
        expect(log).toHaveBeenCalledWith('2 links criados.');
        expect(document.body).toMatchSnapshot();
      };
    });
  }
});
