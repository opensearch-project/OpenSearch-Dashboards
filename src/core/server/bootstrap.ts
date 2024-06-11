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

import chalk from 'chalk';
import cluster from 'cluster';
import { CliArgs, Env, RawConfigService } from './config';
import { Root } from './root';
import { CriticalError } from './errors';

// ToDo: `isMaster` is a Node 14- prop; remove it when Node 18+ is the only engine supported
const isClusterManager = cluster.isPrimary ?? cluster.isMaster;

interface OpenSearchDashboardsFeatures {
  // Indicates whether we can run OpenSearch Dashboards in a so called cluster mode in which
  // OpenSearch Dashboards is run as a "worker" process together with optimizer "worker" process
  // that are orchestrated by the "master" process (dev mode only feature).
  isClusterModeSupported: boolean;

  // Indicates whether we can run OpenSearch Dashboards in REPL mode (dev mode only feature).
  isReplModeSupported: boolean;
}

interface BootstrapArgs {
  configs: string[];
  cliArgs: CliArgs;
  applyConfigOverrides: (config: Record<string, any>) => Record<string, any>;
  features: OpenSearchDashboardsFeatures;
}

/**
 *
 * @internal
 * @param param0 - options
 */
export async function bootstrap({
  configs,
  cliArgs,
  applyConfigOverrides,
  features,
}: BootstrapArgs) {
  if (cliArgs.repl && !features.isReplModeSupported) {
    terminate('OpenSearch Dashboards REPL mode can only be run in development mode.');
  }

  if (cliArgs.optimize) {
    // --optimize is deprecated and does nothing now, avoid starting up and just shutdown
    return;
  }

  // `bootstrap` is exported from the `src/core/server/index` module,
  // meaning that any test importing, implicitly or explicitly, anything concrete
  // from `core/server` will load `dev-utils`. As some tests are mocking the `fs` package,
  // and as `REPO_ROOT` is initialized on the fly when importing `dev-utils` and requires
  // the `fs` package, it causes failures. This is why we use a dynamic `require` here.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { REPO_ROOT } = require('@osd/utils');

  const env = Env.createDefault(REPO_ROOT, {
    configs,
    cliArgs,
    isDevClusterMaster: isClusterManager && cliArgs.dev && features.isClusterModeSupported,
    isDevClusterManager: isClusterManager && cliArgs.dev && features.isClusterModeSupported,
  });

  const rawConfigService = new RawConfigService(env.configs, applyConfigOverrides);
  rawConfigService.loadConfig();

  const root = new Root(rawConfigService, env, onRootShutdown);

  process.on('SIGHUP', () => reloadLoggingConfig());

  // This is only used by the LogRotator service
  // in order to be able to reload the log configuration
  // under the cluster mode
  process.on('message', (msg: any) => {
    if (msg?.reloadLoggingConfig !== true) {
      return;
    }

    reloadLoggingConfig();
  });

  function reloadLoggingConfig() {
    const cliLogger = root.logger.get('cli');
    cliLogger.info('Reloading logging configuration due to SIGHUP.', { tags: ['config'] });

    try {
      rawConfigService.reloadConfig();
    } catch (err) {
      return shutdown(err);
    }

    cliLogger.info('Reloaded logging configuration due to SIGHUP.', { tags: ['config'] });
  }

  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());

  function shutdown(reason?: Error) {
    rawConfigService.stop();
    return root.shutdown(reason);
  }

  try {
    await root.setup();
    await root.start();
  } catch (err) {
    await shutdown(err);
  }
}

/* `onRootShutdown` is called multiple times due to catching and rethrowing of exceptions
 * in Root and bootstrap. The debouncer below is to make sure every catch and rethrow is
 * executed before calling `terminate`.
 */
let shutdownTimer: NodeJS.Timeout;
function onRootShutdown(reason?: any) {
  clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => terminate(reason), 300);
}

function terminate(reason?: any) {
  const exitCode =
    reason === undefined ? 0 : reason instanceof CriticalError ? reason.processExitCode : 1;

  if (reason !== undefined) {
    // There is a chance that logger wasn't configured properly and error that
    // that forced root to shut down could go unnoticed. To prevent this we always
    // mirror such fatal errors in standard output with `console.error`.
    // eslint-disable-next-line
    console.error(`\n${chalk.white.bgRed(' FATAL ')} ${reason}\n`);
  }

  process.exit(exitCode);
}
