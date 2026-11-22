import { spawnSync } from 'child_process';
import { join } from 'path';

/**
 * Build-time guard: every controller endpoint must be mapped to an entitlement feature (or explicitly
 * exempt), and the generated SQL / review files must be up to date with the catalogue definition.
 * It runs the generator in --check mode, which compares instead of writing.
 */
describe('entitlement catalogue and endpoint mapping', () => {
  const backend = join(__dirname, '../../..');

  it('maps every controller endpoint and the generated files are up to date', () => {
    const r = spawnSync(process.execPath, ['scripts/entitlements/build-seed.js', '--check'], { cwd: backend, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${r.stdout}\n${r.stderr}`);
    expect(r.stdout).toMatch(/OK: \d+ endpoints mapped/);
  });
});
