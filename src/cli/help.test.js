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

import { Command } from 'commander';

import help from './help';

describe('CLI help', () => {
  it('summarizes commands and the default command options', () => {
    const program = new Command('bin/opensearch-dashboards').description(
      'OpenSearch Dashboards command line interface'
    );

    program
      .command('serve [config]')
      .description('Run the OpenSearch Dashboards server')
      .option('-p, --port <port>', 'The port to bind to');
    program.command('*', { hidden: true });

    const output = help(program);

    expect(output).toContain('Usage: bin/opensearch-dashboards [command=serve] [options]');
    expect(output).toContain('serve  [options] [config] Run the OpenSearch Dashboards server');
    expect(output).toContain('"serve" Options:');
    expect(output).toContain('-p, --port <port>  The port to bind to');
    expect(output).not.toContain('\n*');
  });

  it('returns help text for a command without subcommands', () => {
    const command = new Command('serve').option('-p, --port <port>', 'The port to bind to');

    expect(help(command)).toContain('Usage: serve [options]');
  });
});
