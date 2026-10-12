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

import Command from './command';

describe('CLI command', () => {
  it('collects arbitrary configuration separately from known options', async () => {
    const program = new Command('bin/opensearch-dashboards');
    let actionOptions;
    let extraOptions;

    program
      .command('serve')
      .collectUnknownOptions()
      .option('-p, --port <port>', 'The port to bind to')
      .action(function (options) {
        actionOptions = options;
        extraOptions = this.getUnknownOptions();
      });

    await program.parseAsync([
      'node',
      'bin/opensearch-dashboards',
      'serve',
      '--port',
      '5601',
      '--logging.root.level=debug',
      '--server.rewriteBasePath',
      'true',
    ]);

    expect(actionOptions).toMatchObject({ port: '5601' });
    expect(extraOptions).toEqual({
      logging: { root: { level: 'debug' } },
      server: { rewriteBasePath: true },
    });
  });

  it('rejects unknown commands with the OSD error message', () => {
    const program = new Command('bin/opensearch-dashboards');
    program.error = jest.fn();

    program.rejectUnknownCommands();
    program.parse(['node', 'bin/opensearch-dashboards', 'unknown-command']);

    expect(program.error).toHaveBeenCalledWith('unknown command unknown-command');
  });
});
