/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import Fs from 'fs';
import Path from 'path';
import { promisify } from 'util';

import { REPO_ROOT } from '@osd/utils';
import { OptimizerConfig, runOptimizer, logOptimizerState } from '@osd/optimizer';

import { BuildContext } from '../contexts';

const asyncRename = promisify(Fs.rename);

export async function optimize({ log, extension, sourceDir, buildDir }: BuildContext) {
  if (!extension.manifest.ui) {
    return;
  }

  log.info('running @osd/optimizer');
  log.indent(2);

  // build bundles into target
  const config = OptimizerConfig.create({
    repoRoot: REPO_ROOT,
    extensionPaths: [sourceDir],
    cache: false,
    dist: true,
    extensionScanDirs: [],
  });

  await runOptimizer(config).pipe(logOptimizerState(log, config)).toPromise();

  // move target into buildDir
  await asyncRename(Path.resolve(sourceDir, 'target'), Path.resolve(buildDir, 'target'));
  log.indent(-2);
}
