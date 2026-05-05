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

import { inspect } from 'util';

import { ToolingLog } from '@osd/dev-utils';
import { tap } from 'rxjs/operators';

import { OptimizerConfig } from './optimizer';
import { OptimizerUpdate$ } from './run_optimizer';
import { CompilerMsg, pipeClosure, ALL_THEMES } from './common';

function renderProgressBar(completed: number, total: number, barWidth = 30): string {
  const pct = total > 0 ? completed / total : 0;
  const filled = Math.round(pct * barWidth);
  const empty = barWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const pctStr = `${Math.round(pct * 100)}%`;
  return `  ${bar} ${pctStr} (${completed}/${total} bundles)`;
}

export function logOptimizerState(log: ToolingLog, config: OptimizerConfig) {
  return pipeClosure((update$: OptimizerUpdate$) => {
    const bundleStates = new Map<string, CompilerMsg['type']>();
    const bundlesThatWereBuilt = new Set<string>();
    let loggedInit = false;
    let progressLineActive = false;
    let lastCompleted = 0;
    let lastTotal = 0;

    const clearProgressLine = () => {
      if (progressLineActive && process.stdout.isTTY) {
        process.stdout.write('\r\x1b[K');
        progressLineActive = false;
      }
    };

    const writeProgressLine = (completed: number, total: number) => {
      lastCompleted = completed;
      lastTotal = total;
      if (process.stdout.isTTY && total > 0) {
        process.stdout.write(`\r\x1b[K${renderProgressBar(completed, total)}`);
        progressLineActive = true;
      }
    };

    const redrawProgress = () => {
      if (progressLineActive) {
        writeProgressLine(lastCompleted, lastTotal);
      }
    };

    // Periodically redraw the progress bar to recover from external log output
    // that may overwrite it, and to handle terminal resizes
    let redrawInterval: ReturnType<typeof setInterval> | undefined;
    if (process.stdout.isTTY) {
      redrawInterval = setInterval(redrawProgress, 1000);
    }

    const stopRedrawInterval = () => {
      if (redrawInterval !== undefined) {
        clearInterval(redrawInterval);
        redrawInterval = undefined;
      }
    };

    return update$.pipe(
      tap((update) => {
        const { event, state } = update;

        if (event?.type === 'worker stdio') {
          log.warning(`worker`, event.stream, event.line);
        }

        if (event?.type === 'worker started') {
          let moduleCount = 0;
          let workUnits = 0;
          for (const bundle of event.bundles) {
            moduleCount += bundle.cache.getModuleCount() ?? NaN;
            workUnits += bundle.cache.getWorkUnits() ?? NaN;
          }

          log.info(
            `starting worker [${event.bundles.length} ${
              event.bundles.length === 1 ? 'bundle' : 'bundles'
            }]`
          );
          log.debug(`modules [${moduleCount}] work units [${workUnits}]`);
        }

        if (state.phase === 'reallocating') {
          log.debug(`changes detected...`);
          return;
        }

        if (state.phase === 'initialized') {
          if (!loggedInit) {
            loggedInit = true;
            log.info(`initialized, ${state.onlineBundles.length} bundles to build`);
            if (config.themeTags.length !== ALL_THEMES.length) {
              log.warning(
                `only building [${config.themeTags}] themes, customize with the OSD_OPTIMIZER_THEMES environment variable`
              );
            }
          }
          return;
        }

        for (const compilerState of state.compilerStates) {
          const { bundleId: id, type } = compilerState;
          const prevBundleState = bundleStates.get(id);

          if (type === prevBundleState) {
            continue;
          }

          if (type === 'running') {
            bundlesThatWereBuilt.add(id);
          }

          bundleStates.set(id, type);

          log.debug(
            `[${id}] state = "${type}"${type !== 'running' ? ` after ${state.durSec} sec` : ''}`
          );
        }

        if (state.phase === 'running' || state.phase === 'initializing') {
          // Update progress bar
          const total = state.onlineBundles.length;
          const completed = state.compilerStates.filter(
            (s) => s.type === 'compiler success' || s.type === 'compiler issue'
          ).length;
          writeProgressLine(completed, total);
          return;
        }

        if (state.phase === 'issue') {
          clearProgressLine();
          stopRedrawInterval();
          log.error(`webpack compile errors`);
          log.indent(4);
          for (const b of state.compilerStates) {
            if (b.type === 'compiler issue') {
              log.error(`[${b.bundleId}] build`);
              log.indent(4);
              log.error(b.failure);
              log.indent(-4);
            }
          }
          log.indent(-4);
          return;
        }

        if (state.phase === 'success') {
          clearProgressLine();
          stopRedrawInterval();
          const buildCount = bundlesThatWereBuilt.size;
          bundlesThatWereBuilt.clear();

          log.success(
            `${buildCount} bundles compiled successfully after ${state.durSec} sec` +
              (config.watch ? ', watching for changes' : '')
          );

          return;
        }

        throw new Error(`unhandled optimizer message: ${inspect(update)}`);
      })
    );
  });
}
