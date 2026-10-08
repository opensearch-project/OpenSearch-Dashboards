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

import { cloneDeep } from 'lodash';
import { Capabilities, CapabilitiesSwitcher } from './types';
import { OpenSearchDashboardsRequest } from '../http';

export type CapabilitiesResolver = (
  request: OpenSearchDashboardsRequest,
  applications: string[]
) => Promise<Capabilities>;

export const getCapabilitiesResolver =
  (
    capabilities: () => Capabilities,
    switchers: () => CapabilitiesSwitcher[]
  ): CapabilitiesResolver =>
  async (request: OpenSearchDashboardsRequest, applications: string[]): Promise<Capabilities> => {
    return resolveCapabilities(capabilities(), switchers(), request, applications);
  };

export const resolveCapabilities = async (
  capabilities: Capabilities,
  switchers: CapabilitiesSwitcher[],
  request: OpenSearchDashboardsRequest,
  applications: string[]
): Promise<Capabilities> => {
  const mergedCaps = cloneDeep(capabilities);
  for (const app of applications) {
    mergedCaps.navLinks[app] = true;
  }
  let resolved: Capabilities = mergedCaps;
  for (const switcher of switchers) {
    const changes = await switcher(request, resolved);
    resolved = recursiveApplyChanges(resolved, changes);
  }
  return resolved;
};

function recursiveApplyChanges<
  TDestination extends Record<string, any>,
  TSource extends Record<string, any>,
>(destination: TDestination, source: TSource): TDestination {
  const result = {} as Record<string, any>;
  for (const key of Object.keys(destination)) {
    const orig = destination[key];
    const changed = source[key];
    if (changed == null) {
      result[key] = orig;
      continue;
    }
    if (typeof orig === 'object' && typeof changed === 'object') {
      result[key] = recursiveApplyChanges(orig, changed);
      continue;
    }
    result[key] = typeof orig === typeof changed ? changed : orig;
  }
  return result as TDestination;
}
