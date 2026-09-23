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

import semver from 'semver';

import { SavedObjectsClientContract } from '../../saved_objects/types';
import { isConfigVersionUpgradeable } from './is_config_version_upgradeable';

/**
 *  Rank a candidate's lineage relative to the version being upgraded to. A
 *  candidate above the target can only have got past isConfigVersionUpgradeable
 *  through its pre-fork allowance -- 6.8.0-7.10.2 is upgradeable into
 *  OpenSearch Dashboards 1.x-3.x even though 7.10.2 sorts above 3.5.0 in
 *  semver. A config from the target's own line is the better source, so
 *  pre-fork ones rank below it. Note this is relative to the target: when
 *  upgrading within the legacy line (e.g. to 7.0.0) nothing is demoted,
 *  because there every candidate is below the target already.
 */
function lineageRank(candidate: string, version: string): number {
  return semver.gt(candidate, version) ? 0 : 1;
}

/**
 *  Order two upgradeable config ids newest-first. Both ids are known to be
 *  valid semver because isConfigVersionUpgradeable rejects anything else.
 */
function compareConfigsDesc(a: string, b: string, version: string): number {
  const lineageDiff = lineageRank(b, version) - lineageRank(a, version);
  if (lineageDiff !== 0) {
    return lineageDiff;
  }
  // rcompare orders descending and already places 3.5.0-rc1 below 3.5.0.
  return semver.rcompare(a, b);
}

/**
 *  Find the most recent SavedConfig that is upgradeable to the specified version
 *  @param {Object} options
 *  @property {SavedObjectsClient} savedObjectsClient
 *  @property {string} version
 *  @return {Promise<SavedConfig|undefined>}
 */
export async function getUpgradeableConfig({
  savedObjectsClient,
  version,
}: {
  savedObjectsClient: SavedObjectsClientContract;
  version: string;
}) {
  // attempt to find a config we can upgrade
  const { saved_objects: savedConfigs } = await savedObjectsClient.find({
    type: 'config',
    page: 1,
    perPage: 1000,
    // buildNum is mapped as a keyword, so this sorts bytewise rather than
    // numerically -- "8467" ranks above "1030500290187953". The ordering that
    // actually decides which config is inherited from is applied below.
    //
    // The sort is still requested because the workspace saved object wrappers
    // treat `type: 'config'` plus `sortField: 'buildNum'` as the signal that
    // this is the config upgrade query and skip workspace scoping for it. Drop
    // it and this query stops seeing global configs on workspace-enabled
    // clusters. See workspace_saved_objects_client_wrapper and
    // workspace_id_consumer_wrapper.
    sortField: 'buildNum',
    sortOrder: 'desc',
  });

  // A config's id is the version it was written for, so ordering by that picks
  // the newest upgradeable config no matter what buildNum happened to hold.
  return savedConfigs
    .filter((savedConfig) => isConfigVersionUpgradeable(savedConfig.id, version))
    .sort((a, b) => compareConfigsDesc(a.id, b.id, version))[0];
}
