/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { REPO_ROOT as OPENSEARCH_DASHBOARDS_ROOT } from '@osd/dev-utils';

export const REPO_ROOT = OPENSEARCH_DASHBOARDS_ROOT;
export const ASSET_DIR = resolve(OPENSEARCH_DASHBOARDS_ROOT, 'built_assets/storybook');
