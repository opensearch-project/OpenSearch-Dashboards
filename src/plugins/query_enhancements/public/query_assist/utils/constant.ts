/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_DATA } from '../../../../data/common';
import { DATASET } from '../../../common';

export const DATA2SUMMARY_AGENT_CONFIG_ID = 'os_data2summary';

export const PPL_SUPPORT_DATASET_TYPES = [
  DEFAULT_DATA.SET_TYPES.INDEX,
  DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
];

export const PROMQL_SUPPORT_DATASET_TYPES = [DATASET.PROMETHEUS];
