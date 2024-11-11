import { writeFile } from 'node:fs/promises';

const letters = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(0x61 + i)
);

async function main() {
  const pre = `// AUTOMATICALLY GENERATED BY \`flow.gen.ts\`\n\nexport const flow: {\n\n`;
  const lines: string[] = [];
  const post = `\n\n} = (value: any, ...fns: Function[]) => {\n  let x = value;\n  for (let i = 0; i < fns.length; i++) x = fns[i]!(x);\n  return x;\n};\n`;
  const MAX = 26;
  if (!(MAX <= 26)) throw new Error();
  for (let i = 0; i < MAX; i++) {
    lines.push(
      `${i === MAX ? '' : '   '.repeat(MAX - i - 1)}<${letters.slice(0, i + 1).join(', ')}>(value: a${letters
        .slice(0, i)
        .map((x, i) => `, fn${i}: (_: ${x}) => ${letters[i + 1]}`)
        .join('')}): ${letters[i]};`
    );
  }
  lines.push(
    `${'   '.repeat(MAX)}(value: unknown, ...fns: Function[]): unknown;`
  );
  await writeFile('./function/flow.ts', `${pre}${lines.join('\n')}${post}`);
}

main();
