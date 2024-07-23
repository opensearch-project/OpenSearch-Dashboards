/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  coveringIndexBuilderMock1,
  coveringIndexBuilderMock2,
  coveringIndexBuilderMockResult1,
  coveringIndexBuilderMockResult2,
  indexOptionsMock1,
  indexOptionsMock2,
  indexOptionsMock3,
  indexOptionsMock4,
  indexOptionsMock5,
  indexOptionsMock6,
  indexOptionsMock7,
  indexOptionsMockResult1,
  indexOptionsMockResult2,
  indexOptionsMockResult3,
  indexOptionsMockResult4,
  indexOptionsMockResult5,
  indexOptionsMockResult6,
  indexOptionsMockResult7,
  materializedViewBuilderMock1,
  materializedViewBuilderMock2,
  materializedViewBuilderMockResult1,
  materializedViewBuilderMockResult2,
  skippingIndexBuilderMock1,
  skippingIndexBuilderMock2,
  skippingIndexBuilderMockResult1,
  skippingIndexBuilderMockResult2,
} from '../../../../mocks';
import {
  buildIndexOptions,
  coveringIndexQueryBuilder,
  materializedQueryViewBuilder,
  skippingIndexQueryBuilder,
} from './query_builder';

describe('buildIndexOptions', () => {
  it('should build index options with auto refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock1);
    expect(indexOptions).toEqual(indexOptionsMockResult1);
  });

  it('should build index options with interval refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock2);
    expect(indexOptions).toEqual(indexOptionsMockResult2);
  });

  it('should build index options with checkpoint location', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock3);
    expect(indexOptions).toEqual(indexOptionsMockResult3);
  });

  it('should build index options with manual refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock4);
    expect(indexOptions).toEqual(indexOptionsMockResult4);
  });

  it('should build index options with watermark delay', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock5);
    expect(indexOptions).toEqual(indexOptionsMockResult5);
  });

  it('should build index options with manual refresh and checkpoint', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock6);
    expect(indexOptions).toEqual(indexOptionsMockResult6);
  });

  it('should build index options with manual incremental refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock7);
    expect(indexOptions).toEqual(indexOptionsMockResult7);
  });

  describe('skippingIndexQueryBuilder', () => {
    it('should build skipping index query as expected with interval refresh', () => {
      const result = skippingIndexQueryBuilder(skippingIndexBuilderMock1);
      expect(result).toEqual(skippingIndexBuilderMockResult1);
    });

    it('should build skipping index query as expected with auto refresh', () => {
      const result = skippingIndexQueryBuilder(skippingIndexBuilderMock2);
      expect(result).toEqual(skippingIndexBuilderMockResult2);
    });
  });

  describe('coveringIndexQueryBuilder', () => {
    it('should build covering index query as expected with interval refresh', () => {
      const result = coveringIndexQueryBuilder(coveringIndexBuilderMock1);
      expect(result).toEqual(coveringIndexBuilderMockResult1);
    });

    it('should build covering index query as expected with auto refresh', () => {
      const result = coveringIndexQueryBuilder(coveringIndexBuilderMock2);
      expect(result).toEqual(coveringIndexBuilderMockResult2);
    });
  });

  describe('materializedQueryViewBuilder', () => {
    it('should build materialized view query as expected with interval refresh', () => {
      const result = materializedQueryViewBuilder(materializedViewBuilderMock1);
      expect(result).toEqual(materializedViewBuilderMockResult1);
    });

    it('should build materialized view query as expected with auto refresh', () => {
      const result = materializedQueryViewBuilder(materializedViewBuilderMock2);
      expect(result).toEqual(materializedViewBuilderMockResult2);
    });
  });
});
