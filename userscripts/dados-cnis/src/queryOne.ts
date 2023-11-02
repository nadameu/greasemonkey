import { Either, Left, Right } from '@nadameu/either';

export function queryOne<T extends HTMLElement>(
  selector: string,
  context: ParentNode = document
): Either<Error, T> {
  const elements = context.querySelectorAll<T>(selector);
  if (elements.length < 1)
    return Left(new Error(`Elemento não encontrado: \`${selector}\`.`));
  if (elements.length > 1)
    return Left(new Error(`Mais de um elemento encontrado: \`${selector}\`.`));
  return Right(elements[0]!);
}
