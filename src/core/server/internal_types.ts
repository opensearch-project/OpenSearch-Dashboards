/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Type } from '@osd/config-schema';

import { CapabilitiesSetup, CapabilitiesStart } from './capabilities';
import {
  ConfigDeprecationProvider,
  InternalDynamicConfigServiceSetup,
  InternalDynamicConfigServiceStart,
} from './config';
import { ContextSetup } from './context';
import { InternalOpenSearchServiceSetup, InternalOpenSearchServiceStart } from './opensearch';
import { InternalHttpServiceSetup, InternalHttpServiceStart } from './http';
import {
  InternalSavedObjectsServiceSetup,
  InternalSavedObjectsServiceStart,
} from './saved_objects';
import { InternalUiSettingsServiceSetup, InternalUiSettingsServiceStart } from './ui_settings';
import { InternalEnvironmentServiceSetup } from './environment';
import { InternalMetricsServiceSetup, InternalMetricsServiceStart } from './metrics';
import { InternalRenderingServiceSetup } from './rendering';
import { InternalHttpResourcesSetup } from './http_resources';
import { InternalStatusServiceSetup } from './status';
import { AuditTrailSetup, AuditTrailStart } from './audit_trail';
import { InternalLoggingServiceSetup } from './logging';
import { CoreUsageDataStart } from './core_usage_data';
import { InternalSecurityServiceSetup } from './security/types';
import { CrossCompatibilityServiceStart } from './cross_compatibility';
import { InternalWorkspaceServiceSetup, InternalWorkspaceServiceStart } from './workspace';

/** @internal */
export interface InternalCoreSetup {
  capabilities: CapabilitiesSetup;
  context: ContextSetup;
  http: InternalHttpServiceSetup;
  opensearch: InternalOpenSearchServiceSetup;
  savedObjects: InternalSavedObjectsServiceSetup;
  status: InternalStatusServiceSetup;
  uiSettings: InternalUiSettingsServiceSetup;
  environment: InternalEnvironmentServiceSetup;
  rendering: InternalRenderingServiceSetup;
  httpResources: InternalHttpResourcesSetup;
  auditTrail: AuditTrailSetup;
  logging: InternalLoggingServiceSetup;
  metrics: InternalMetricsServiceSetup;
  security: InternalSecurityServiceSetup;
  dynamicConfig: InternalDynamicConfigServiceSetup;
  workspace: InternalWorkspaceServiceSetup;
}

/**
 * @internal
 */
export interface InternalCoreStart {
  capabilities: CapabilitiesStart;
  opensearch: InternalOpenSearchServiceStart;
  http: InternalHttpServiceStart;
  metrics: InternalMetricsServiceStart;
  savedObjects: InternalSavedObjectsServiceStart;
  uiSettings: InternalUiSettingsServiceStart;
  auditTrail: AuditTrailStart;
  coreUsageData: CoreUsageDataStart;
  crossCompatibility: CrossCompatibilityServiceStart;
  dynamicConfig: InternalDynamicConfigServiceStart;
  workspace: InternalWorkspaceServiceStart;
}

/**
 * @internal
 */
export interface ServiceConfigDescriptor<T = any> {
  path: string;
  /**
   * Schema to use to validate the configuration.
   */
  schema: Type<T>;
  /**
   * Provider for the {@link ConfigDeprecation} to apply to the plugin configuration.
   */
  deprecations?: ConfigDeprecationProvider;
}
