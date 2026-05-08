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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import minimatch from 'minimatch';

import { deleteAll, deleteEmptyFolders, scanDelete, Task, GlobalTask, normalizePath } from '../lib';

const TYPESCRIPT_REGEXPS: RegExp[] = [/\.(ts|tsx|d\.ts)$/, /tsconfig.*\.json$/];

const makeRegexps = (patterns: string[]) =>
  patterns.map((pattern) => {
    const re = minimatch.makeRe(pattern, { nocase: true });
    // scanDelete matches against paths produced by `path.join`, which uses the OS native
    // separator (backslash on Windows). minimatch emits `/`-only regexes, which silently
    // miss on Windows. Relax every literal `/` in the pattern to match either separator
    // so the task behaves identically on Linux, macOS, and Windows.
    return new RegExp((re as RegExp).source.replace(/\\\//g, '[\\/\\\\]'), (re as RegExp).flags);
  });

const EXTRA_FILES_FROM_MODULES_REGEXPS: RegExp[] = makeRegexps([
  // tests
  '**/test',
  '**/tests',
  '**/__tests__',
  '**/mocha.opts',
  '**/*.test.js',
  '**/*.snap',
  '**/coverage',

  // docs
  '**/doc',
  '**/docs',
  '**/CONTRIBUTING.md',
  '**/Contributing.md',
  '**/contributing.md',
  '**/History.md',
  '**/HISTORY.md',
  '**/history.md',
  '**/CHANGELOG.md',
  '**/Changelog.md',
  '**/changelog.md',

  // examples
  '**/example',
  '**/examples',
  '**/demo',
  '**/samples',

  // bins
  '**/.bin',

  // linters
  '**/.eslintrc',
  '**/.eslintrc.js',
  '**/.eslintrc.yml',
  '**/.prettierrc',
  '**/.jshintrc',
  '**/.babelrc',
  '**/.jscs.json',
  '**/.lint',

  // hints
  '**/*.flow',
  '**/*.webidl',
  '**/*.map',
  '**/@types',

  // scripts
  '**/*.sh',
  '**/*.bat',
  '**/*.exe',
  '**/Gruntfile.js',
  '**/gulpfile.js',
  '**/Makefile',

  // untranspiled sources
  '**/*.coffee',
  '**/*.scss',
  '**/*.sass',
  '**/.ts',
  '**/.tsx',

  // editors
  '**/.editorconfig',
  '**/.vscode',

  // git
  '**/.gitattributes',
  '**/.gitkeep',
  '**/.gitempty',
  '**/.gitmodules',
  '**/.keep',
  '**/.empty',

  // ci
  '**/.travis.yml',
  '**/.coveralls.yml',
  '**/.instanbul.yml',
  '**/appveyor.yml',
  '**/.zuul.yml',

  // metadata
  '**/package-lock.json',
  '**/component.json',
  '**/bower.json',
  '**/yarn.lock',

  // misc
  '**/.*ignore',
  '**/.DS_Store',
  '**/Dockerfile',
  '**/docker-compose.yml',
]);

export const Clean: GlobalTask = {
  global: true,
  description: 'Cleaning artifacts from previous builds',

  async run(config, log) {
    await deleteAll(
      [
        config.resolveFromRepo('build'),
        config.resolveFromRepo('target'),
        config.resolveFromRepo('.node_binaries'),
      ],
      log
    );
  },
};

export const CleanPackages: Task = {
  description: 'Cleaning source for packages that are now installed in node_modules',

  async run(config, log, build) {
    await deleteAll([build.resolvePath('packages'), build.resolvePath('yarn.lock')], log);
  },
};

/**
 * Performs the combined work of the old CleanTypescript + CleanExtraFilesFromModules
 * tasks with only one traversal of node_modules (by far the largest subtree):
 *   1. node_modules gets walked once with both regex sets merged.
 *   2. The rest of the build tree is walked once with only the TypeScript
 *      regexes (the node_modules-only patterns like **\/test are intentionally
 *      NOT applied outside node_modules to avoid deleting OSD source like
 *      src/**\/__tests__).
 * Both walks run concurrently.
 */
export async function runCleanExtraBuildFilesImpl(
  buildRoot: string,
  nodeModulesPath: string
): Promise<number> {
  const [outsideCount, insideCount] = await Promise.all([
    scanDelete({
      directory: buildRoot,
      regularExpressions: TYPESCRIPT_REGEXPS,
      excludePaths: [nodeModulesPath],
    }),
    scanDelete({
      directory: nodeModulesPath,
      regularExpressions: [...TYPESCRIPT_REGEXPS, ...EXTRA_FILES_FROM_MODULES_REGEXPS],
    }),
  ]);
  return outsideCount + insideCount;
}

export const CleanExtraBuildFiles: Task = {
  description: 'Cleaning typescript sources, tests, docs, etc. from build tree',

  async run(config, log, build) {
    log.info(
      'Deleted %d files',
      await runCleanExtraBuildFilesImpl(build.resolvePath(), build.resolvePath('node_modules'))
    );
  },
};

export const CleanExtraBinScripts: Task = {
  description: 'Cleaning extra bin/* scripts from platform-specific builds',

  async run(config, log, build) {
    for (const platform of config.getTargetPlatforms()) {
      if (platform.isWindows()) {
        await deleteAll(
          [
            normalizePath(build.resolvePathForPlatform(platform, 'bin', '*')),
            `!${normalizePath(build.resolvePathForPlatform(platform, 'bin', '*.bat'))}`,
          ],
          log
        );
      } else {
        await deleteAll([build.resolvePathForPlatform(platform, 'bin', '*.bat')], log);
      }
    }
  },
};

export const CleanEmptyFolders: Task = {
  description: 'Cleaning all empty folders recursively',

  async run(config, log, build) {
    // Delete every single empty folder from
    // the distributable except the plugins,
    // data, and assets folder.
    await deleteEmptyFolders(log, build.resolvePath('.'), [
      build.resolvePath('plugins'),
      build.resolvePath('data'),
      build.resolvePath('assets'),
    ]);
  },
};
