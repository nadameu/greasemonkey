export type Trampoline<a> = { value: a } | (() => Trampoline<a>);
