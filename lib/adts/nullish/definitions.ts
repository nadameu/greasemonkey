export type nullish = null | undefined;
export type Nullish<a> = NonNullable<a> | nullish;
