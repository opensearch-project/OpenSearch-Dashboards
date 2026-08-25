/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

// The editor previews a step before the query runs, and the server resolves the
// step it actually sends; both must agree. The optimizer refuses cross-plugin
// imports of another bundle's common/, so the file is copied instead of shared.
// Keep the copies byte-identical: a preview that disagrees with the server is
// exactly the bug the resolved-step readout exists to prevent.
describe('prom_step copy', () => {
  const canonical = path.resolve(
    __dirname,
    '../../../../../query_enhancements/common/prom_step.ts'
  );
  const copy = path.resolve(__dirname, './prom_step.ts');

  it('is identical to query_enhancements/common/prom_step.ts', () => {
    expect(fs.readFileSync(copy, 'utf8')).toEqual(fs.readFileSync(canonical, 'utf8'));
  });
});
