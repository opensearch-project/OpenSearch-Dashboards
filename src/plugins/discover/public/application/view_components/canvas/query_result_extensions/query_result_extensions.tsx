/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  QueryResultExtensionConfig,
  QueryResultExtensionDependencies,
} from '../../../../../../data/public';
import { QueryResultExtension } from './query_result_extension';

export interface QueryResultExtensionsProps {
  configMap?: Record<string, QueryResultExtensionConfig>;
  bannerContainer: Element;
  dependencies: QueryResultExtensionDependencies;
}

export const QueryResultExtensions = ({
  bannerContainer,
  configMap,
  dependencies,
}: QueryResultExtensionsProps) => {
  const sortedConfigs = useMemo(() => {
    if (!configMap || Object.keys(configMap).length === 0) return [];
    return Object.values(configMap).sort((a, b) => a.order - b.order);
  }, [configMap]);

  return (
    <>
      {Object.values(sortedConfigs).map((config) => {
        return (
          <QueryResultExtension
            config={config}
            bannerContainer={bannerContainer}
            dependencies={dependencies}
            key={config.id}
          />
        );
      })}
    </>
  );
};
