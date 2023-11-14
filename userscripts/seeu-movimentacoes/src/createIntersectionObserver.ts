import { createObserver } from './createObserver';

export const createIntersectionObserver = () =>
  createObserver<Element, []>(
    callbacks =>
      new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && callbacks.has(entry.target)) {
            for (const callback of callbacks.get(entry.target)!) {
              callback();
            }
          }
        }
      })
  );
