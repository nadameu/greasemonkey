import { createObserver } from './createObserver';

export const createMutationObserver = () =>
  createObserver<Node, [node: Node]>(callbacks => {
    const mut = new MutationObserver(records => {
      for (const record of records) {
        if (callbacks.has(record.target)) {
          for (const callback of callbacks.get(record.target)!) {
            for (const node of record.addedNodes) {
              callback(node);
            }
          }
        }
      }
    });
    return {
      disconnect() {
        mut.disconnect();
      },
      observe(key) {
        mut.observe(key, { childList: true, subtree: true });
      },
    };
  });
