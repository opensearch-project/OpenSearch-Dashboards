/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_APP_CATEGORIES } from '../../../../../core/public';
import { GetStartCard } from './types';

/**
 * All getting start cards
 */
export const getStartCards: GetStartCard[] = [
  // getStarted
  {
    appId: 'home',
    featureDescription: 'Discover pre-loaded datasets before adding your own.',
    featureName: 'Sample Datasets',
    link: '/app/home#/tutorial_directory',
    category: DEFAULT_APP_CATEGORIES.getStarted,
  },
  {
    appId: 'workspace_create',
    featureDescription: 'Build a collaborative hub for your team.',
    featureName: 'Workspaces',
    link: '/app/workspace_create',
    category: DEFAULT_APP_CATEGORIES.getStarted,
  },
  {
    appId: 'datasources',
    featureDescription: 'Seamlessly integrate your data sources.',
    featureName: 'Data Sources',
    link: '/app/datasources',
    category: DEFAULT_APP_CATEGORIES.getStarted,
  },
  {
    appId: 'management',
    featureDescription: 'Unlock seamless data access.',
    featureName: 'Index Patterns',
    link: '/app/management/opensearch-dashboards/indexPatterns',
    category: DEFAULT_APP_CATEGORIES.getStarted,
  },
  {
    appId: 'integrations',
    featureDescription: 'Gain instant insights with pre-configured log dashboards.',
    featureName: 'Integrations',
    link: '/app/integrations',
    category: DEFAULT_APP_CATEGORIES.getStarted,
  },
  // dashboardAndReport
  {
    appId: 'dashboards',
    featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
    featureName: 'Dashboards',
    link: '/app/dashboards',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  },
  {
    appId: 'visualize',
    featureDescription:
      'Unlock insightful data exploration with powerful visualization and aggregation tools.',
    featureName: 'Visualizations',
    link: '/app/visualize',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  },
  {
    appId: 'maps-dashboards',
    featureDescription: 'Unlock spatial insights with multi-layer map visualizations.',
    featureName: 'Maps',
    link: '/app/maps-dashboards',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  },
  {
    appId: 'observability-notebooks',
    featureDescription: 'Gain real-time visibility with dynamic, data-powered report generation.',
    featureName: 'Notebooks',
    link: '/app/observability-notebooks',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  },
  {
    appId: 'reports-dashboards',
    featureDescription: 'Collaborate effectively with multi-format report sharing.',
    featureName: 'Reports',
    link: '/app/reports-dashboards',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  },
  // investigate
  {
    appId: 'discover',
    featureDescription: 'Uncover insights with raw data exploration.',
    featureName: 'Discover',
    link: '/app/data-explorer/discover',
    category: DEFAULT_APP_CATEGORIES.investigate,
  },
  {
    appId: 'observability-traces',
    featureDescription: 'Unveil performance bottlenecks with event flow visualization.',
    featureName: 'Traces',
    link: '/app/observability-traces',
    category: DEFAULT_APP_CATEGORIES.investigate,
  },
  {
    appId: 'observability-metrics',
    featureDescription: 'Transform logs into actionable visualizations with metric extraction.',
    featureName: 'Metrics',
    link: '/app/observability-metrics',
    category: DEFAULT_APP_CATEGORIES.investigate,
  },
  {
    appId: 'observability-applications',
    featureDescription:
      'Gain comprehensive system visibility with unified log, trace, and metric analysis.',
    featureName: 'Applications',
    link: '/app/observability-applications',
    category: DEFAULT_APP_CATEGORIES.investigate,
  },
  // detect
  {
    appId: 'alerting',
    featureDescription: 'Proactively identify risks with customizable alter triggers.',
    featureName: 'Alerts',
    link: '/app/alerting',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'anomaly-detection-dashboards',
    featureDescription: 'Unveil anomalies with real-time data monitoring.',
    featureName: 'Anomaly Detectors',
    link: '/app/anomaly-detection-dashboards#/detectors',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Receive timely notifications with detector-driven alert configuration.',
    featureName: 'Threat Alerts',
    link: '/app/opensearch_security_analytics_dashboards#/alerts',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Proactively safeguard your systems with customizable detection rules.',
    featureName: 'Threat Detectors',
    link: '/app/opensearch_security_analytics_dashboards#/detectors',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Tailor detection capabilities with flexible rule management.',
    featureName: 'Detection Rules',
    link: '/app/opensearch_security_analytics_dashboards#/rules',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Detect multi-system threats with correlation rule builder.',
    featureName: 'Correlations',
    link: '/app/opensearch_security_analytics_dashboards#/correlations',
    category: DEFAULT_APP_CATEGORIES.detect,
  },
  {
    appId: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Uncover hidden patterns and trends with detector finding analysis.',
    featureName: 'Findings',
    link: '/app/opensearch_security_analytics_dashboards#/findings',
    category: DEFAULT_APP_CATEGORIES.investigate,
  },
  // build search solutions
  {
    appId: 'searchRelevance',
    featureDescription: 'Optimize query performance with side-by-side comparison.',
    featureName: 'Compare Search Results',
    link: '/app/searchRelevance',
    category: DEFAULT_APP_CATEGORIES.searchSolution,
  },
];
