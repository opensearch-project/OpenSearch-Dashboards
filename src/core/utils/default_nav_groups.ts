/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ChromeNavGroup, NavGroupType } from '../types';

export const ALL_USE_CASE_ID = 'all';

const defaultNavGroups = {
  dataAdministration: {
    id: 'dataAdministration',
    title: i18n.translate('core.ui.group.dataAdministration.title', {
      defaultMessage: 'data administration',
    }),
    description: i18n.translate('core.ui.group.dataAdministration.description', {
      defaultMessage: 'Apply policies or security on your data.',
    }),
    order: 1000,
    type: NavGroupType.SYSTEM,
  },
  settingsAndSetup: {
    id: 'settingsAndSetup',
    title: i18n.translate('core.ui.group.settingsAndSetup.title', {
      defaultMessage: 'settings and setup',
    }),
    description: i18n.translate('core.ui.group.settingsAndSetup.description', {
      defaultMessage: 'Set up your cluster with index patterns.',
    }),
    order: 2000,
    type: NavGroupType.SYSTEM,
  },
  all: {
    id: ALL_USE_CASE_ID,
    title: i18n.translate('core.ui.group.all.title', {
      defaultMessage: 'All use case',
    }),
    description: i18n.translate('core.ui.group.all.description', {
      defaultMessage: 'This is a usse case contains all the features.',
    }),
    order: 3000,
    type: NavGroupType.SYSTEM,
  },
  observability: {
    id: 'observability',
    title: i18n.translate('core.ui.group.observability.title', {
      defaultMessage: 'Observability',
    }),
    description: i18n.translate('core.ui.group.observability.description', {
      defaultMessage:
        'Gain visibility into system health, performance, and reliability through monitoring and analysis of logs, metrics, and traces.',
    }),
    order: 4000,
  },
  'security-analytics': {
    id: 'security-analytics',
    title: i18n.translate('core.ui.group.security.analytics.title', {
      defaultMessage: 'Security Analytics',
    }),
    description: i18n.translate('core.ui.group.security.analytics.description', {
      defaultMessage:
        'Detect and investigate potential security threats and vulnerabilities across your systems and data.',
    }),
    order: 5000,
  },
  analytics: {
    id: 'analytics',
    title: i18n.translate('core.ui.group.analytics.title', {
      defaultMessage: 'Analytics',
    }),
    description: i18n.translate('core.ui.group.analytics.description', {
      defaultMessage:
        'Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.',
    }),
    order: 6000,
  },
  search: {
    id: 'search',
    title: i18n.translate('core.ui.group.search.title', {
      defaultMessage: 'Search',
    }),
    description: i18n.translate('core.ui.group.search.description', {
      defaultMessage:
        "Quickly find and explore relevant information across your organization's data sources.",
    }),
    order: 7000,
  },
} as const;

/** @internal */
export const DEFAULT_NAV_GROUPS: Record<
  keyof typeof defaultNavGroups,
  ChromeNavGroup
> = Object.freeze(defaultNavGroups);
