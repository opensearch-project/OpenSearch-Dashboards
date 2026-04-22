/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';

export type MetricsPageMode = 'explore' | 'query';
export const MetricsPageModeContext = createContext<MetricsPageMode>('explore');
export const useMetricsPageMode = () => useContext(MetricsPageModeContext);
