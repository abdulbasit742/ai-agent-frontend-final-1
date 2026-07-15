import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const secretPatterns = [
  { name: 'OpenAI-style API key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Telegram bot token', pattern: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/g },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const findings = [];
for (const file of trackedFiles) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    continue;
  }
  if (size > 1_500_000) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const { name, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${file}: possible ${name}`);
  }

  if (/^\.env(?:\.|$)/.test(file) && file !== '.env.example') {
    const unsafeKeys = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split('=', 1)[0])
      .filter((key) => !key.startsWith('VITE_'));
    if (unsafeKeys.length) findings.push(`${file}: non-public environment keys are tracked`);
  }
}

if (findings.length) {
  console.error('Repository checks failed:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Repository checks passed for ${trackedFiles.length} tracked files.`);
