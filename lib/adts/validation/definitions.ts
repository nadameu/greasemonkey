import { Either } from '../either';

export type Validation<e, a> = Either<e, a>;
