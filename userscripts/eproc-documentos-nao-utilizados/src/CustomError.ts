export class CustomError extends Error {
  constructor(
    message?: string,
    public payload: any = {}
  ) {
    super(message);
  }
}
CustomError.prototype.name = 'CustomError';
