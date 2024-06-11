/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { OpenSearchDashboards } from './opensearch_dashboards';
import { readYarnLock } from './yarn_lock';

const rootPath = resolve(`${__dirname}/__fixtures__/opensearch-dashboards-dev`);

const linkedDepmarker = 'file:';
const linkedDepmarkerLength = linkedDepmarker.length;

describe('#readYarnLock', () => {
  it('includes an entry with the absolute path to a linked dependency', async () => {
    const devProject = await OpenSearchDashboards.loadFrom(rootPath);
    const { allDependencies } = devProject.getProject('opensearch-dashboards');
    const expectedObject = Object.keys(allDependencies).reduce(
      (accumulator: { [key: string]: any }, key) => {
        if (allDependencies[key].startsWith('file:')) {
          accumulator[
            key +
              '@file:' +
              resolve(
                devProject.getAbsolute(),
                allDependencies[key].substring(linkedDepmarkerLength)
              )
          ] = expect.any(Object);
        }
        return accumulator;
      },
      {}
    );

    const result = await readYarnLock(devProject);

    expect(result).toMatchObject(expectedObject);
  });
});
