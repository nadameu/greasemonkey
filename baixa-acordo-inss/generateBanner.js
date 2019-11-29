export function generateBanner(metadata) {
  const pairs = Object.entries(metadata).flatMap(([key, valueOrValues]) => {
    if (Array.isArray(valueOrValues)) {
      return valueOrValues.map(v => [key, v]);
    }
    return [[key, valueOrValues]];
  });
  const comments = pairs.map(([key, value]) => `// @${key} ${value}`);
  return ['// ==UserScript==', ...comments, '// ==/UserScript==', ''].join('\n');
}
