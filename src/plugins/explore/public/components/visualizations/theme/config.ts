/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config as VgConfig } from 'vega';
// @ts-expect-error TS2307 TODO(ts-error): fixme
import type { Config as VlConfig } from 'vega-lite';

export type Config = VgConfig | VlConfig;
