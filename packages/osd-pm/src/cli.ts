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

import dedent from 'dedent';
import getopts from 'getopts';
import { resolve } from 'path';
import { pickLevelFromFlags } from '@osd/dev-utils/tooling_log';

import { commands } from './commands';
import { runCommand } from './run';
import { log } from './utils/log';

function help() {
  log.info(
    dedent`
      usage: osd <command> [<args>]

      By default commands are run for OpenSearch Dashboards itself, all packages in the 'packages/'
      folder and for all plugins in './plugins' and '../opensearch-dashboards-extra'.

      Available commands:

        ${Object.values(commands)
          .map((command) => `${command.name} - ${command.description}`)
          .join('\n        ')}

      Global options:

        -e, --exclude           Exclude specified project. Can be specified multiple times to exclude multiple projects, e.g. '-e opensearch-dashboards -e @osd/pm'.
        -i, --include           Include only specified projects. If left unspecified, it defaults to including all projects.
        --skip-opensearch-dashboards-plugins   Filter all plugins in ./plugins and ../opensearch-dashboards-extra when running command.
        --no-cache              Disable the bootstrap cache
        --verbose               Set log level to verbose
        --debug                 Set log level to debug
        --quiet                 Set log level to error
        --silent                Disable log output
    ` + '\n'
  );
}

export async function run(argv: string[]) {
  log.setLogLevel(
    pickLevelFromFlags(
      getopts(argv, {
        boolean: ['verbose', 'debug', 'quiet', 'silent'],
      })
    )
  );

  // We can simplify this setup (and remove this extra handling) once Yarn
  // starts forwarding the `--` directly to this script, see
  // https://github.com/yarnpkg/yarn/blob/b2d3e1a8fe45ef376b716d597cc79b38702a9320/src/cli/index.js#L174-L182
  if (argv.includes('--')) {
    log.error(`Using "--" is not allowed, as it doesn't work with 'yarn osd'.`);
    process.exit(1);
  }

  const options = getopts(argv, {
    alias: {
      e: 'exclude',
      h: 'help',
      i: 'include',
    },
    default: {
      cache: true,
    },
    boolean: ['prefer-offline', 'frozen-lockfile', 'cache'],
  });

  const args = options._;

  if (options.help || args.length === 0) {
    help();
    return;
  }

  // This `rootPath` is relative to `./dist/` as that's the location of the
  // built version of this tool.
  const rootPath = resolve(__dirname, '../../../');

  const commandName = args[0];
  const extraArgs = args.slice(1);

  const commandOptions = { options, extraArgs, rootPath };

  const command = commands[commandName];
  if (command === undefined) {
    log.error(`[${commandName}] is not a valid command, see 'osd --help'`);
    process.exit(1);
  }

  await runCommand(command, commandOptions);
}
