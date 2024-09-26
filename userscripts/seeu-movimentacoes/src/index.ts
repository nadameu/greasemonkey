import { isJust } from '@nadameu/adts';
import { main } from './main';

try {
  const resultado = main();
  if (isJust(resultado)) {
    console.log(
      '<SEEU - Movimentações>',
      'Erro encontrado:',
      resultado.value.erro
    );
  }
} catch (err) {
  console.group('<SEEU - Movimentações>');
  console.error(err);
  console.groupEnd();
}
