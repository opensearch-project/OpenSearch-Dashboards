/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ChromeNavGroup, NavGroupType } from '../types';

export const ALL_USE_CASE_ID = 'all';
export const OBSERVABILITY_USE_CASE_ID = 'observability';
export const SECURITY_ANALYTICS_USE_CASE_ID = 'security-analytics';
export const ESSENTIAL_USE_CASE_ID = 'essentials';
export const SEARCH_USE_CASE_ID = 'search';

const defaultNavGroups = {
  dataAdministration: {
    id: 'dataAdministration',
    title: i18n.translate('core.ui.group.dataAdministration.title', {
      defaultMessage: 'Data administration',
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
      defaultMessage: 'Settings and setup',
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
      defaultMessage: 'Analytics (All)',
    }),
    description: i18n.translate('core.ui.group.all.description', {
      defaultMessage: 'This is a use case contains all the features.',
    }),
    order: 3000,
    icon: 'wsAnalytics',
  },
  observability: {
    id: OBSERVABILITY_USE_CASE_ID,
    title: i18n.translate('core.ui.group.observability.title', {
      defaultMessage: 'Observability',
    }),
    description: i18n.translate('core.ui.group.observability.description', {
      defaultMessage: 'Gain visibility into your application and infrastructure',
    }),
    order: 4000,
    icon: 'wsObservability',
  },
  'security-analytics': {
    id: SECURITY_ANALYTICS_USE_CASE_ID,
    title: i18n.translate('core.ui.group.security.analytics.title', {
      defaultMessage: 'Security Analytics',
    }),
    description: i18n.translate('core.ui.group.security.analytics.description', {
      defaultMessage: 'Enhance your security posture with advanced analytics',
    }),
    order: 5000,
    icon: 'wsSecurityAnalytics',
  },
  essentials: {
    id: ESSENTIAL_USE_CASE_ID,
    title: i18n.translate('core.ui.group.essential.title', {
      defaultMessage: 'Essentials',
    }),
    description: i18n.translate('core.ui.group.essential.description', {
      defaultMessage:
        'Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.',
    }),
    order: 7000,
    icon: 'wsEssentials',
  },
  search: {
    id: SEARCH_USE_CASE_ID,
    title: i18n.translate('core.ui.group.search.title', {
      defaultMessage: 'Search',
    }),
    description: i18n.translate('core.ui.group.search.description', {
      defaultMessage: 'Discover and query your data with ease',
    }),
    order: 6000,
    icon: 'wsSearch',
  },
} as const;

/** @internal */
export const DEFAULT_NAV_GROUPS: Record<
  keyof typeof defaultNavGroups,
  ChromeNavGroup
> = Object.freeze(defaultNavGroups);
