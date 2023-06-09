/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceTemplate } from '../types';

/** @internal */
export const DEFAULT_WORKSPACE_TEMPLATES: Record<string, WorkspaceTemplate> = Object.freeze({
  search: {
    id: 'search',
    label: 'Search',
    order: 1000,
    description:
      "Intro paragraph blur about search, key features, and why you'd want to create ana search workspace",
  },
  observability: {
    id: 'observability',
    label: 'Observability',
    order: 2000,
    description:
      "Intro paragraph blur about observability, key features, and why you'd want to create ana observability workspace",
  },
  security_analytics: {
    id: 'security_analytics',
    label: 'Security Analytics',
    order: 3000,
    description:
      "Intro paragraph blur about security analytics, key features, and why you'd want to create ana security analytics workspace",
  },
  general_analysis: {
    id: 'general_analysis',
    label: 'General Analytics',
    order: 4000,
    description:
      "Intro paragraph blur about analytics, key features, and why you'd want to create ana analytics workspace",
  },
});
