/**
 * Test runner wrapper that strips Karma-specific flags (e.g. --browsers) that
 * are not compatible with the Vitest-based unit-test builder.
 */
import { execFileSync } from 'node:child_process';

const ngBin = new URL('./node_modules/@angular/cli/bin/ng.js', import.meta.url).pathname;

execFileSync(
  process.execPath,
  [ngBin, 'test', '--watch=false'],
  { stdio: 'inherit', env: process.env }
);
