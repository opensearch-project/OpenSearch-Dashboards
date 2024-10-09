/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { Logger } from '@osd/logging';
import { Request } from 'hapi__hapi';
import { ApiResponse } from '@opensearch-project/opensearch/.';
import { ConfigIdentifier } from '../types';
import { DYNAMIC_APP_CONFIG_INDEX_PREFIX } from './constants';
import { OpenSearchDashboardsRequest } from '../../http';

/**
 * Given a configIdentifier:
 *  - if name is provided, convert it from camelCase to snake_case
 *  - if pluginConfigPath is provided (for plugin configs ONLY), convert the ["config", "path"] to config.path
 *
 * @param configIdentifier
 */
export const pathToString = (configIdentifier: ConfigIdentifier) => {
  const { name, pluginConfigPath } = configIdentifier;
  if (pluginConfigPath) {
    return Array.isArray(pluginConfigPath) ? pluginConfigPath.join('.') : pluginConfigPath;
  }
  return _.snakeCase(name);
};

export const createApiResponse = <TResponse = Record<string, any>>(
  opts: Partial<ApiResponse> = {}
): ApiResponse<TResponse> => {
  return {
    body: {} as any,
    statusCode: 200,
    headers: {},
    warnings: [],
    meta: {} as any,
    ...opts,
  };
};

/**
 * Given the config from the config file and the config store, merge the two configs.
 *
 * @param defaultConfigs
 * @param configStoreConfigs
 */
export const mergeConfigs = (
  defaultConfigs: Record<string, unknown>,
  configStoreConfigs: Record<string, unknown>
) => {
  // Ensures that the entire array of the configStoreConfigs overrides existing configs
  const mergeCustomizer = (target: any, source: any) => {
    if (_.isArray(target)) {
      return source;
    }
  };
  return _.mergeWith(defaultConfigs, configStoreConfigs, mergeCustomizer);
};

export const createLocalStore = (logger: Logger, request: Request, headers: string[]) => {
  return new Map(
    headers.map((header: string) => {
      try {
        return [header, request.headers[header]];
      } catch (err) {
        logger.warn(`Header ${header} not found in request`);
        return [header, undefined];
      }
    })
  );
};

export const getDynamicConfigIndexName = (n: number) => {
  return `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_${n}`;
};

/**
 * Basic check to ensure the index matches the pattern (will pass for ${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_0)
 *
 * @param index
 * @returns
 */
export const isDynamicConfigIndex = (index: string) => {
  const regex = new RegExp(`^${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_\\d+$`);
  return regex.test(index);
};

export const extractVersionFromDynamicConfigIndex = (index: string) => {
  if (!isDynamicConfigIndex(index)) {
    return 0;
  }
  const indexSuffix = index.replace(`${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_`, '');
  return Number(indexSuffix);
};

export const createLocalStoreFromOsdRequest = (
  logger: Logger,
  request: OpenSearchDashboardsRequest,
  headers: string[]
) => {
  if (!request.auth.isAuthenticated) {
    return undefined;
  }
  return new Map(
    headers.map((header: string) => {
      try {
        logger.debug(`${header}: ${request.headers[header]}`);
        return [header, request.headers[header]];
      } catch (err) {
        logger.warn(`Header ${header} not found in request`);
        return [header, undefined];
      }
    })
  );
};
