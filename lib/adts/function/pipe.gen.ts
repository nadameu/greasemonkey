import { writeFile } from 'node:fs/promises';

const letters = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(0x61 + i)
);

async function main() {
  const pre = `// AUTOMATICALLY GENERATED BY \`pipe.gen.ts\`\n\nexport const pipe: {\n\n`;
  const lines: string[] = [];
  const post = `\n\n} = (...fns: Function[]) => (value: any) => {\n  let x = value;\n  for (let i = 0; i < fns.length; i++) x = fns[i]!(x);\n  return x;\n};\n`;
  const MAX = 26;
  if (!(MAX <= 26)) throw new Error();
  for (let i = 0; i < MAX; i++) {
    if (i === 0) {
      lines.push(`${'   '.repeat(MAX - 1)}   (): <a>(value: a) => a;`);
      continue;
    }
    lines.push(
      `${i === MAX ? '' : '   '.repeat(MAX - i - 1)}<${letters.slice(0, i + 1).join(', ')}>(${letters
        .slice(0, i)
        .map((x, i) => `fn${i}: (_: ${x}) => ${letters[i + 1]}`)
        .join(', ')}): (value: a) => ${letters[i]};`
    );
  }
  lines.push(
    `${'   '.repeat(MAX)}(...fns: Function[]): (value: unknown) => unknown;`
  );
  await writeFile('./function/pipe.ts', `${pre}${lines.join('\n')}${post}`);
}

main();