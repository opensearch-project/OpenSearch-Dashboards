/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPortalProps } from '@elastic/eui';
import React, { useMemo } from 'react';
import {
  SearchBarExtension,
  SearchBarExtensionConfig,
  SearchBarExtensionDependencies,
} from './search_bar_extension';

interface SearchBarExtensionsProps {
  configs?: SearchBarExtensionConfig[];
  dependencies: SearchBarExtensionDependencies;
  portalInsert: EuiPortalProps['insert'];
}

export const SearchBarExtensions: React.FC<SearchBarExtensionsProps> = (props) => {
  const configs = useMemo(() => {
    if (!props.configs) return [];

    const seenIds = new Set();
    props.configs.forEach((config) => {
      if (seenIds.has(config.id)) {
        throw new Error(`Duplicate search bar extension id '${config.id}' found.`);
      }
      seenIds.add(config.id);
    });

    return [...props.configs].sort((a, b) => a.order - b.order);
  }, [props.configs]);

  return (
    <>
      {configs.map((config) => (
        <SearchBarExtension
          key={config.id}
          config={config}
          dependencies={props.dependencies}
          portalInsert={props.portalInsert}
        />
      ))}
    </>
  );
};
