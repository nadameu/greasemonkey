# Modo de usar

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import target from '@nadameu/esbuild-target';

// https://vitejs.dev/config/
export default defineConfig({
  build: { target },
});
```
