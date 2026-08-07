/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type BackendDistribution = 'opensearch' | 'elasticsearch';

export interface BackendInfo {
  distribution: BackendDistribution;
  version: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
}

export const DEFAULT_DOCUMENT_TYPE = '_doc';
