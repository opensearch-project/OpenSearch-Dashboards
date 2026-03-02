/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { Duration } from 'moment';
import { WorkspaceStart } from 'opensearch-dashboards/server/workspace';
import { InternalDynamicConfigServiceStart } from 'opensearch-dashboards/server/config';
import { CrossCompatibilityServiceStart } from 'opensearch-dashboards/server/cross_compatibility';
import { CoreUsageDataStart } from 'opensearch-dashboards/server/core_usage_data';
import { UiSettingsServiceStart } from 'opensearch-dashboards/server/ui_settings';
import { InternalMetricsServiceStart } from 'opensearch-dashboards/server/metrics';
import { InternalHttpServiceStart } from 'opensearch-dashboards/server/http';
import { InternalOpenSearchServiceStart } from 'opensearch-dashboards/server/opensearch';
import { CapabilitiesStart } from 'opensearch-dashboards/server';
import { InternalSavedObjectsServiceStart } from 'opensearch-dashboards/server/saved_objects/saved_objects_service';
import { ITask, TaskDefinition } from '../task/types';

// Healcheck
export interface HealthCheckServiceSetup {
  register: (task: TaskDefinition) => void;
  get: (name: string) => ITask;
  getAll: () => ITask[];
}

export type HealthCheckServiceStart = HealthCheckServiceSetup;

export interface HealthCheckServiceStartDeps {
  capabilities: CapabilitiesStart;
  opensearch: InternalOpenSearchServiceStart;
  http: InternalHttpServiceStart;
  metrics: InternalMetricsServiceStart;
  savedObjects: InternalSavedObjectsServiceStart;
  uiSettings: UiSettingsServiceStart;
  coreUsageData: CoreUsageDataStart;
  crossCompatibility: CrossCompatibilityServiceStart;
  dynamicConfig: InternalDynamicConfigServiceStart;
  workspace: WorkspaceStart;
}

export interface HealthCheckConfigDefinition {
  enabled: boolean;
  checks_enabled: string | string[];
  retries_delay: Duration;
  max_retries: number;
  interval: Duration;
  server_not_ready_troubleshooting_link: string;
}

export type HealthCheckConfig = Omit<HealthCheckConfigDefinition, 'retries_delay' | 'interval'> & {
  retries_delay: number;
  interval: number;
};
