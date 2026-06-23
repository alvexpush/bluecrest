import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

await build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(projectRoot, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: path.join(projectRoot, 'dist', 'server.cjs'),
});
