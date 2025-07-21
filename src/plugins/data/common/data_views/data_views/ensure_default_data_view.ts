/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { includes } from 'lodash';
import { DataViewsContract } from './data_views';
import { DataViewSavedObjectsClientCommon, DataViewUiSettingsCommon } from '../types';

export type EnsureDefaultDataView = () => Promise<unknown | void> | undefined;

export const createEnsureDefaultDataView = (
  uiSettings: DataViewUiSettingsCommon,
  onRedirectNoDataView: () => Promise<unknown> | void,
  canUpdateUiSetting?: boolean,
  savedObjectsClient?: DataViewSavedObjectsClientCommon
) => {
  /**
   * Checks whether a default index pattern is set and exists and defines
   * one otherwise.
   */
  return async function ensureDefaultDataView(this: DataViewsContract) {
    if (canUpdateUiSetting === false) {
      return;
    }
    let patterns = await this.getIds();
    let defaultId = await uiSettings.get('defaultIndex');
    let defined = !!defaultId;
    const exists = includes(patterns, defaultId);

    if (defined && !exists) {
      await uiSettings.remove('defaultIndex');
      defaultId = defined = false;
    }

    if (defined) {
      const dataView = await this.get(defaultId);
      const dataSourceRef = dataView?.dataSourceRef;
      if (!dataSourceRef) {
        return;
      }
      let isDefaultDataViewReferenceValid = true;

      if (!dataSourceRef.id) {
        isDefaultDataViewReferenceValid = false;
      } else {
        try {
          const result = await this.getDataSource(dataSourceRef.id);
          isDefaultDataViewReferenceValid = !(
            result.error?.statusCode === 403 || result.error?.statusCode === 404
          );
        } catch (e) {
          // The logic below for updating the default index pattern only handles cases where the data source is not found or the user lacks access permissions
          // For other unexpected errors, we simply return to prevent infinite loops when updating the default index pattern.
          return;
        }
      }

      if (!isDefaultDataViewReferenceValid) {
        try {
          if (savedObjectsClient) {
            const datasources = await savedObjectsClient.find({ type: 'data-source' });
            const dataViews = await savedObjectsClient.find({ type: 'index-pattern' });
            const existDataSources = datasources.map((item) => item.id);
            patterns = [];
            dataViews.forEach((item) => {
              const sourceRef = item.references?.find((ref) => ref.type === 'data-source');
              let isDataSourceReferenceValid = false;
              /**
               * The reference is valid when either:
               * 1. No data source is referenced (using local cluster, which must be available for OpenSearch Dashboards to function)
               * 2. A data source is referenced with a valid ID
               */
              if (!sourceRef) {
                isDataSourceReferenceValid = true;
              }

              if (sourceRef?.id && existDataSources.includes(sourceRef.id)) {
                isDataSourceReferenceValid = true;
              }

              if (isDataSourceReferenceValid) {
                patterns.push(item.id);
              }
            });
          }
        } catch (e) {
          return;
        }
      } else {
        return;
      }
    }

    // If there is any index pattern created, set the first as default
    if (patterns.length >= 1) {
      defaultId = patterns[0];
      await uiSettings.set('defaultIndex', defaultId);
    } else {
      const isEnhancementsEnabled = await uiSettings.get('query:enhancements:enabled');
      const shouldRedirect = !isEnhancementsEnabled;
      if (shouldRedirect) return onRedirectNoDataView();
      else return;
    }
  };
};
