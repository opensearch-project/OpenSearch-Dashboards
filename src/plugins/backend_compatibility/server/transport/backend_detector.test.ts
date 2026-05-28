/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectBackend, ClusterInfoResponse } from './backend_detector';

describe('backend_detector', () => {
  describe('detectBackend', () => {
    it('detects OpenSearch by distribution field', () => {
      const info: ClusterInfoResponse = {
        name: 'node1',
        cluster_name: 'opensearch-cluster',
        cluster_uuid: 'abc123',
        version: {
          number: '2.11.0',
          distribution: 'opensearch',
          build_type: 'tar',
        },
      };
      const result = detectBackend(info);
      expect(result.distribution).toBe('opensearch');
      expect(result.majorVersion).toBe(2);
      expect(result.minorVersion).toBe(11);
      expect(result.patchVersion).toBe(0);
    });

    it('detects OpenSearch by tagline', () => {
      const info: ClusterInfoResponse = {
        name: 'node1',
        cluster_name: 'cluster',
        cluster_uuid: 'abc123',
        version: { number: '1.3.0' },
        tagline: 'The OpenSearch Project',
      };
      const result = detectBackend(info);
      expect(result.distribution).toBe('opensearch');
    });

    it('detects Elasticsearch 6.x', () => {
      const info: ClusterInfoResponse = {
        name: 'node1',
        cluster_name: 'es-cluster',
        cluster_uuid: 'def456',
        version: {
          number: '6.8.23',
          build_type: 'tar',
          lucene_version: '7.7.3',
        },
        tagline: 'You Know, for Search',
      };
      const result = detectBackend(info);
      expect(result.distribution).toBe('elasticsearch');
      expect(result.majorVersion).toBe(6);
      expect(result.minorVersion).toBe(8);
      expect(result.patchVersion).toBe(23);
    });

    it('detects Elasticsearch 7.x', () => {
      const info: ClusterInfoResponse = {
        name: 'node1',
        cluster_name: 'es-cluster',
        cluster_uuid: 'ghi789',
        version: {
          number: '7.10.2',
          build_type: 'tar',
        },
        tagline: 'You Know, for Search',
      };
      const result = detectBackend(info);
      expect(result.distribution).toBe('elasticsearch');
      expect(result.majorVersion).toBe(7);
      expect(result.minorVersion).toBe(10);
    });

    it('throws on unparseable version', () => {
      const info: ClusterInfoResponse = {
        name: 'node1',
        cluster_name: 'cluster',
        cluster_uuid: 'abc',
        version: { number: 'not-a-version' },
      };
      expect(() => detectBackend(info)).toThrow('Unable to parse backend version');
    });
  });
});
