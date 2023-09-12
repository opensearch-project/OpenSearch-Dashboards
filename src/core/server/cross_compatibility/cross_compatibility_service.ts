/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatPluginsResponse } from '@opensearch-project/opensearch/api/types';
import semver from 'semver';
import { CrossCompatibilityResult, CrossCompatibilityServiceStart } from './types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { OpenSearchServiceStart } from '../opensearch';
import { CompatibleEnginePluginVersions, PluginName } from '../plugins/types';

export interface StartDeps {
  opensearch: OpenSearchServiceStart;
  plugins: Map<PluginName, CompatibleEnginePluginVersions>;
}

export class CrossCompatibilityService {
  private readonly log: Logger;

  constructor(coreContext: CoreContext) {
    this.log = coreContext.logger.get('cross-compatibility-service');
  }

  start({ opensearch, plugins }: StartDeps): CrossCompatibilityServiceStart {
    this.log.warn('Starting cross compatibility service');
    return {
      verifyOpenSearchPluginsState: (pluginName: string) => {
        const pluginOpenSearchDeps = plugins.get(pluginName) || {};
        return this.verifyOpenSearchPluginsState(opensearch, pluginOpenSearchDeps, pluginName);
      },
    };
  }

  public async getOpenSearchPlugins(opensearch: OpenSearchServiceStart) {
    // Makes cat.plugin api call to fetch list of OpenSearch plugins installed on the cluster
    try {
      const { body } = await opensearch.client.asInternalUser.cat.plugins<any[]>({
        format: 'JSON',
      });
      return body;
    } catch (error) {
      this.log.warn(
        `Cat API call to OpenSearch to get list of plugins installed on the cluster has failed: ${error}`
      );
      return [];
    }
  }

  public checkPluginVersionCompatibility(
    pluginOpenSearchDeps: CompatibleEnginePluginVersions,
    opensearchInstalledPlugins: CatPluginsResponse,
    dashboardsPluginName: string
  ) {
    const results: CrossCompatibilityResult[] = [];
    for (const [pluginName, versionRange] of Object.entries(pluginOpenSearchDeps)) {
      // add check to see if the Dashboards plugin version is compatible with installed OpenSearch plugin
      const { isCompatible, installedPluginVersions } = this.isVersionCompatibleOSPluginInstalled(
        opensearchInstalledPlugins,
        pluginName,
        versionRange
      );
      results.push({
        pluginName,
        isCompatible: !isCompatible ? false : true,
        incompatibilityReason: !isCompatible
          ? `OpenSearch plugin "${pluginName}" in the version range "${versionRange}" is not installed on the OpenSearch for the OpenSearch Dashboards plugin to function as expected.`
          : '',
        installedVersions: installedPluginVersions,
      });

      if (!isCompatible) {
        this.log.warn(
          `OpenSearch plugin "${pluginName}" is not installed on the cluster for the OpenSearch Dashboards plugin "${dashboardsPluginName}" to function as expected.`
        );
      }
    }
    return results;
  }

  private async verifyOpenSearchPluginsState(
    opensearch: OpenSearchServiceStart,
    pluginOpenSearchDeps: CompatibleEnginePluginVersions,
    pluginName: string
  ): Promise<CrossCompatibilityResult[]> {
    this.log.info('Checking OpenSearch Plugin version compatibility');
    // make _cat/plugins?format=json call to the OpenSearch instance
    const opensearchInstalledPlugins = await this.getOpenSearchPlugins(opensearch);
    const results = this.checkPluginVersionCompatibility(
      pluginOpenSearchDeps,
      opensearchInstalledPlugins,
      pluginName
    );
    return results;
  }

  private isVersionCompatibleOSPluginInstalled(
    opensearchInstalledPlugins: CatPluginsResponse,
    depPluginName: string,
    depPluginVersionRange: string
  ) {
    let isCompatible = false;
    const installedPluginVersions = new Set<string>();
    opensearchInstalledPlugins.forEach((obj) => {
      if (obj.component === depPluginName && obj.version) {
        installedPluginVersions.add(obj.version);
        if (semver.satisfies(semver.coerce(obj.version)!.version, depPluginVersionRange)) {
          isCompatible = true;
        }
      }
    });
    return { isCompatible, installedPluginVersions: [...installedPluginVersions] };
  }
}
