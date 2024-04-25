/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GetStartCard } from './types';
import { WORKSPACE_APP_CATEGORIES } from '../../../common/constants';

/**
 * All getting start cards
 */
export const getStartCards: GetStartCard[] = [
  // getStarted
  {
    id: 'home',
    featureDescription: 'Discover pre-loaded datasets before adding your own.',
    featureName: 'Sample Datasets',
    link: '/app/home#/tutorial_directory',
    category: WORKSPACE_APP_CATEGORIES.getStarted,
  },
  {
    id: 'workspace_create',
    featureDescription: 'Build a collaborative hub for your team.',
    featureName: 'Workspaces',
    link: '/app/workspace_create',
    category: WORKSPACE_APP_CATEGORIES.getStarted,
  },
  {
    id: 'datasources',
    featureDescription: 'Seamlessly integrate your data sources.',
    featureName: 'Data Sources',
    link: '/app/datasources',
    category: WORKSPACE_APP_CATEGORIES.getStarted,
  },
  {
    id: 'management',
    featureDescription: 'Unlock seamless data access.',
    featureName: 'Index Patterns',
    link: '/app/management/opensearch-dashboards/indexPatterns',
    category: WORKSPACE_APP_CATEGORIES.getStarted,
  },
  {
    id: 'integrations',
    featureDescription: 'Gain instant insights with pre-configured log dashboards.',
    featureName: 'Integrations',
    link: '/app/integrations',
    category: WORKSPACE_APP_CATEGORIES.getStarted,
  },
  // dashboardAndReport
  {
    id: 'dashboards',
    featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
    featureName: 'Dashboards',
    link: '/app/dashboards',
    category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
  },
  {
    id: 'visualize',
    featureDescription:
      'Unlock insightful data exploration with powerful visualization and aggregation tools.',
    featureName: 'Visualizations',
    link: '/app/visualize',
    category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
  },
  {
    id: 'maps-dashboards',
    featureDescription: 'Unlock spatial insights with multi-layer map visualizations.',
    featureName: 'Maps',
    link: '/app/maps-dashboards',
    category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
  },
  {
    id: 'observability-notebooks',
    featureDescription: 'Gain real-time visibility with dynamic, data-powered report generation.',
    featureName: 'Notebooks',
    link: '/app/observability-notebooks',
    category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
  },
  {
    id: 'reports-dashboards',
    featureDescription: 'Collaborate effectively with multi-format report sharing.',
    featureName: 'Reports',
    link: '/app/reports-dashboards',
    category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
  },
  // investigate
  {
    id: 'discover',
    featureDescription: 'Uncover insights with raw data exploration.',
    featureName: 'Discover',
    link: '/app/data-explorer/discover',
    category: WORKSPACE_APP_CATEGORIES.investigate,
  },
  {
    id: 'observability-traces',
    featureDescription: 'Unveil performance bottlenecks with event flow visualization.',
    featureName: 'Traces',
    link: '/app/observability-traces',
    category: WORKSPACE_APP_CATEGORIES.investigate,
  },
  {
    id: 'observability-metrics',
    featureDescription: 'Transform logs into actionable visualizations with metric extraction.',
    featureName: 'Metrics',
    link: '/app/observability-metrics',
    category: WORKSPACE_APP_CATEGORIES.investigate,
  },
  {
    id: 'observability-applications',
    featureDescription:
      'Gain comprehensive system visibility with unified log, trace, and metric analysis.',
    featureName: 'Applications',
    link: '/app/observability-applications',
    category: WORKSPACE_APP_CATEGORIES.investigate,
  },
  // detect
  {
    id: 'alerting',
    featureDescription: 'Proactively identify risks with customizable alter triggers.',
    featureName: 'Alerts',
    link: '/app/alerting',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'anomaly-detection-dashboards',
    featureDescription: 'Unveil anomalies with real-time data monitoring.',
    featureName: 'Anomaly Detectors',
    link: '/app/anomaly-detection-dashboards#/detectors',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Receive timely notifications with detector-driven alert configuration.',
    featureName: 'Threat Alerts',
    link: '/app/opensearch_security_analytics_dashboards#/alerts',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Proactively safeguard your systems with customizable detection rules.',
    featureName: 'Threat Detectors',
    link: '/app/opensearch_security_analytics_dashboards#/detectors',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Tailor detection capabilities with flexible rule management.',
    featureName: 'Detection Rules',
    link: '/app/opensearch_security_analytics_dashboards#/rules',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Detect multi-system threats with correlation rule builder.',
    featureName: 'Correlations',
    link: '/app/opensearch_security_analytics_dashboards#/correlations',
    category: WORKSPACE_APP_CATEGORIES.detect,
  },
  {
    id: 'opensearch_security_analytics_dashboards',
    featureDescription: 'Uncover hidden patterns and trends with detector finding analysis.',
    featureName: 'Findings',
    link: '/app/opensearch_security_analytics_dashboards#/findings',
    category: WORKSPACE_APP_CATEGORIES.investigate,
  },
  // build search solutions
  {
    id: 'searchRelevance',
    featureDescription: 'Optimize query performance with side-by-side comparison.',
    featureName: 'Compare Search Results',
    link: '/app/searchRelevance',
    category: WORKSPACE_APP_CATEGORIES.searchSolution,
  },
];
