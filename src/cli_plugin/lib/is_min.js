/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

export function isMin() {
  return !fs.existsSync(path.resolve(__dirname, '../../../osd-extra'));
}
