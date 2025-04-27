/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolingLog } from '@osd/dev-utils';
import { REPO_ROOT } from '@osd/utils';
import { join } from 'path';
import del from 'del';

export const clean = async ({ log }: { log: ToolingLog }) => {
  log.info('Cleaning Storybook build folder');

  const dir = join(REPO_ROOT, 'built_assets', 'storybook');
  log.info('Deleting folder:', dir);
  await del([join(dir, '*')]);
  await del([dir]);
};
