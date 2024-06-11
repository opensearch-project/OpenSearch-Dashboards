/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { rm } from 'fs/promises';
import { resolve } from 'path';
import { spawn } from './child_process';
import { Project } from './project';
import { log } from './log';

const BuildTargetPresets = {
  web: '@osd/babel-preset/webpack_preset',
  node: '@osd/babel-preset/node_preset',
};

export type BuildTargetTypes = keyof typeof BuildTargetPresets;
export const BuildTargets = Object.keys(BuildTargetPresets) as BuildTargetTypes[];

/**
 * Run script in the given directory
 */
export async function buildTargetedPackage({
  pkg,
  sourceMaps,
}: {
  pkg: Project;
  sourceMaps?: boolean;
}) {
  log.debug(`[${pkg.name}] deleting old output`);
  await rm(pkg.targetLocation, { force: true, recursive: true });

  log.debug(`[${pkg.name}] generating type definitions`);

  await spawn('tsc', [...(sourceMaps ? ['--declarationMap', 'true'] : [])], {
    cwd: pkg.path,
  });

  // Generate [A], [A and B], or [A, B, and C] labels
  const targetsDisplayLabel = pkg.buildTargets
    .join(', ')
    .replace(/, ([^,]+)$/, pkg.buildTargets.length > 2 ? ', and $1' : ' and $1');
  log.debug(`[${pkg.name}] transpiling for ${targetsDisplayLabel}`);

  await Promise.all([
    ...pkg.buildTargets.map((target) =>
      spawn(
        'babel',
        [
          'src',
          '--no-babelrc',
          '--presets',
          BuildTargetPresets[target],
          '--out-dir',
          resolve(pkg.targetLocation, target),
          '--extensions',
          '.ts,.js,.tsx',
          '--ignore',
          '**/*.test.ts,**/*.test.tsx',
          '--quiet',
          ...(sourceMaps ? ['--source-maps', 'inline'] : []),
        ],
        {
          env: {
            BABEL_ENV: target,
          },
          cwd: pkg.path,
        }
      )
    ),
  ]);
}
