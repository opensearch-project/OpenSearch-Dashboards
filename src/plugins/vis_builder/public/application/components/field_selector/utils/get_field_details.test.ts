/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
import realHits from 'fixtures/real_hits.js';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { coreMock } from '../../../../../../../core/public/mocks';
import { getStubIndexPattern } from '../../../../../../data/public/test_utils';
import { getFieldDetails } from './get_field_details';
import _ from 'lodash';

describe('getFieldDetails', () => {
  const indexPattern = getStubIndexPattern(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  test('should have error if index pattern is missing', () => {
    const details = getFieldDetails(indexPattern.fields[0], []);

    expect(details.total).toBe(0);
    expect(details.error).toMatchInlineSnapshot(`"Index pattern not specified."`);
  });

  test('should have error if there are no hits', () => {
    const details = getFieldDetails(indexPattern.fields[0], [], indexPattern);

    expect(details.total).toBe(0);
    expect(details.error).toMatchInlineSnapshot(
      `"No documents match the selected query and filters. Try increasing time range or removing filters."`
    );
  });

  test('should show details if hits are available for the index pattern field', () => {
    const details = getFieldDetails(
      indexPattern.fields[0],
      _.each(_.cloneDeep(realHits), (hit) => indexPattern.flattenHit(hit)),
      indexPattern
    );

    expect(details.exists).toBe(20);
    expect(details.total).toBe(20);
    expect(details.buckets.length).toBe(5);
    expect(details.error).toBe('');
  });
});
