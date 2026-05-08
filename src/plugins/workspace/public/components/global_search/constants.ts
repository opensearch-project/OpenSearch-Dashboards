/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported asset types for global search
 */
export enum AssetType {
  Dashboard = 'dashboard',
  Visualization = 'visualization',
}

/**
 * Array of all supported asset types for API queries
 */
export const SUPPORTED_ASSET_TYPES: string[] = Object.values(AssetType);

export type SupportedAssetType = AssetType;
