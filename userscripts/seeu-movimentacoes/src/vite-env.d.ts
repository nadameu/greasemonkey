/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />

declare const Ajax:
  | {
      Updater: {
        (
          arg0: string,
          arg1: string,
          arg2: { onComplete: Function; onFailure: Function }
        ): unknown;
      };
    }
  | undefined;
