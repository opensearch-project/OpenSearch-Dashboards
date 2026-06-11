/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { BackendDistribution, BackendInfo } from './types';

export interface ClusterInfoResponse {
  name: string;
  cluster_name: string;
  cluster_uuid: string;
  version: {
    number: string;
    distribution?: string;
    build_type?: string;
    build_hash?: string;
    build_date?: string;
    build_snapshot?: boolean;
    lucene_version?: string;
    minimum_wire_compatibility_version?: string;
    minimum_index_compatibility_version?: string;
  };
  tagline?: string;
}

export function detectBackend(clusterInfo: ClusterInfoResponse): BackendInfo {
  const { version } = clusterInfo;
  const versionNumber = version.number;

  const isOpenSearch =
    version.distribution?.toLowerCase() === 'opensearch' ||
    clusterInfo.tagline?.toLowerCase().includes('opensearch');

  const distribution: BackendDistribution = isOpenSearch ? 'opensearch' : 'elasticsearch';

  const parsed = semver.coerce(versionNumber);
  if (!parsed) {
    throw new Error(`Unable to parse backend version: ${versionNumber}`);
  }

  return {
    distribution,
    version: versionNumber,
    majorVersion: parsed.major,
    minorVersion: parsed.minor,
    patchVersion: parsed.patch,
  };
}
