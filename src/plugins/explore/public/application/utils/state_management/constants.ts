/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorMode } from './types';

export const DEFAULT_EDITOR_MODE = EditorMode.Query;

/**
 * Target bucket count for Traces charts
 * Uses ~20 buckets for 3 charts vs default 50 for Logs (1 chart)
 */
export const TRACES_CHART_BAR_TARGET = 20;
