/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
  DATA_SOURCE_SAVED_OBJECT_TYPE,
} from '../../data_source/common';
export const WORKSPACE_FATAL_ERROR_APP_ID = 'workspace_fatal_error';
export const WORKSPACE_CREATE_APP_ID = 'workspace_create';
export const WORKSPACE_LIST_APP_ID = 'workspace_list';
export const WORKSPACE_DETAIL_APP_ID = 'workspace_detail';
export const WORKSPACE_INITIAL_APP_ID = 'workspace_initial';
export const WORKSPACE_NAVIGATION_APP_ID = 'workspace_navigation';
export const WORKSPACE_COLLABORATORS_APP_ID = 'workspace_collaborators';

export const WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID = 'workspace';
export const WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID =
  'workspace_conflict_control';
export const WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID = 'workspace_ui_settings';
/**
 * UI setting for user default workspace
 */
export const DEFAULT_WORKSPACE = 'defaultWorkspace';
export const ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED = 'essentialWorkspace:dismissGetStarted';
export const ANALYTICS_WORKSPACE_DISMISS_GET_STARTED = 'analyticsWorkspace:dismissGetStarted';

export const WORKSPACE_ID_CONSUMER_WRAPPER_ID = 'workspace_id_consumer';

/**
 * The priority for these wrappers matters:
 * 1. WORKSPACE_ID_CONSUMER wrapper should be the first wrapper to execute, as it will add the `workspaces` field
 * to `options` based on the request, which will be honored by permission control wrapper and conflict wrapper.
 * 2. The order of permission wrapper and conflict wrapper does not matter as no dependency between these two wrappers.
 */
export const PRIORITY_FOR_WORKSPACE_ID_CONSUMER_WRAPPER = -3;
export const PRIORITY_FOR_WORKSPACE_UI_SETTINGS_WRAPPER = -2;
export const PRIORITY_FOR_WORKSPACE_CONFLICT_CONTROL_WRAPPER = -1;
export const PRIORITY_FOR_PERMISSION_CONTROL_WRAPPER = 0;

/**
 * The repository wrapper should be the wrapper closest to the repository client,
 * so we give a large number to the wrapper
 */
export const PRIORITY_FOR_REPOSITORY_WRAPPER = Number.MAX_VALUE;

/**
 *
 * This is a temp solution to store relationships between use cases  and features.
 * The relationship should be provided by plugin itself. The workspace plugin should
 * provide some method to register single feature to the use case map instead of
 * store a static map in workspace.
 *
 */

export const WORKSPACE_USE_CASES = Object.freeze({
  observability: {
    id: 'observability',
    title: i18n.translate('workspace.usecase.observability.title', {
      defaultMessage: 'Observability',
    }),
    description: i18n.translate('workspace.usecase.observability.description', {
      defaultMessage: 'Gain visibility into your application and infrastructure',
    }),
    icon: 'wsObservability',
    features: [
      'discover',
      'dashboards',
      'visualize',
      'maps-dashboards',
      'observability-notebooks',
      'reports-dashboards',
      'integrations',
      'alerting',
      'anomaly-detection-dashboards',
      'observability-metrics',
      'observability-traces',
      'observability-applications',
      // Add management avoid index patterns application not found for dashboards or visualize
      'management',
    ] as string[],
  },
  'security-analytics': {
    id: 'security-analytics',
    title: i18n.translate('workspace.usecase.security.analytics.title', {
      defaultMessage: 'Security Analytics',
    }),
    description: i18n.translate('workspace.usecase.analytics.description', {
      defaultMessage: 'Enhance your security posture with advanced analytics',
    }),
    icon: 'wsSecurityAnalytics',
    features: [
      'discover',
      'dashboards',
      'visualize',
      'maps-dashboards',
      'observability-notebooks',
      'reports-dashboards',
      'integrations',
      'alerting',
      'anomaly-detection-dashboards',
      'opensearch_security_analytics_dashboards',
      // Add management avoid index patterns application not found for dashboards or visualize
      'management',
    ] as string[],
  },
  essentials: {
    id: 'essentials',
    title: i18n.translate('workspace.usecase.essentials.title', {
      defaultMessage: 'Essentials',
    }),
    description: i18n.translate('workspace.usecase.essentials.description', {
      defaultMessage: 'Get start with just the basics',
    }),
    icon: 'wsEssentials',
    features: [
      'discover',
      'dashboards',
      'visualize',
      'maps-dashboards',
      'observability-notebooks',
      'reports-dashboards',
      'integrations',
      'alerting',
      'anomaly-detection-dashboards',
      // Add management avoid index patterns application not found for dashboards or visualize
      'management',
    ] as string[],
  },
  search: {
    id: 'search',
    title: i18n.translate('workspace.usecase.search.title', {
      defaultMessage: 'Search',
    }),
    description: i18n.translate('workspace.usecase.search.description', {
      defaultMessage: 'Discover and query your data with ease',
    }),
    icon: 'wsSearch',
    features: [
      'discover',
      'dashboards',
      'visualize',
      'maps-dashboards',
      'reports-dashboards',
      'searchRelevance',
      // Add management avoid index patterns application not found for dashboards or visualize
      'management',
    ] as string[],
  },
});

export const MAX_WORKSPACE_PICKER_NUM = 3;
export const RECENT_WORKSPACES_KEY = 'recentWorkspaces';
export const CURRENT_USER_PLACEHOLDER = '%me%';

export const MAX_WORKSPACE_NAME_LENGTH = 40;
export const MAX_WORKSPACE_DESCRIPTION_LENGTH = 200;

export enum AssociationDataSourceModalMode {
  OpenSearchConnections = 'opensearch-connections',
  DirectQueryConnections = 'direction-query-connections',
}
export const USE_CASE_PREFIX = 'use-case-';
export const OPENSEARCHDASHBOARDS_CONFIG_PATH = 'opensearchDashboards';

// Workspace will handle both data source and data connection type saved object.
export const WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES = [
  DATA_SOURCE_SAVED_OBJECT_TYPE,
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
];

export const USE_CASE_CARD_GRADIENT_PREFIX = 'workspace-initial-use-case-card';

export const OSD_ADMIN_WILDCARD_MATCH_ALL = '*';
