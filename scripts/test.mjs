import { realpathSync } from 'node:fs';
import { spawn } from 'node:child_process';

const cwd = realpathSync.native(process.cwd());
const child = spawn(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', ...process.argv.slice(2)],
  { cwd, stdio: 'inherit' },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
