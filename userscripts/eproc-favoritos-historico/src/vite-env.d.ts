/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}
