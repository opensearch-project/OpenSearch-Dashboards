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

import { describeRequest } from './describe_request';

describe('describeRequest', () => {
  it('shows endpoint and a relative date for a recent request', () => {
    const label = describeRequest({ endpoint: '/_search', time: Date.now() });

    expect(label).toContain('/_search');
    expect(label).toContain('ago');
    expect(label).not.toContain('body not saved');
  });

  it('uses an absolute date for requests older than a week', () => {
    const elevenDaysAgo = Date.now() - 11 * 24 * 60 * 60 * 1000;

    const label = describeRequest({ endpoint: '/_search', time: elevenDaysAgo });

    expect(label).toContain('/_search');
    expect(label).not.toContain('ago');
  });

  it('marks an entry whose body was not persisted', () => {
    const label = describeRequest({
      endpoint: '/_component_template/big',
      time: Date.now(),
      dataOmitted: true,
    });

    expect(label).toContain('/_component_template/big');
    expect(label).toContain('body not saved');
  });

  it('does not mark entries that kept their body', () => {
    const label = describeRequest({
      endpoint: '/_search',
      time: Date.now(),
      dataOmitted: false,
    });

    expect(label).not.toContain('body not saved');
  });
});
