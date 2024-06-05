/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  SearchBarExtension,
  SearchBarExtensionConfig,
  SearchBarExtensionDependencies,
} from './search_bar_extension';

interface SearchBarExtensionsProps extends SearchBarExtensionDependencies {
  configs?: SearchBarExtensionConfig[];
  portalContainer: Element;
}

const SearchBarExtensions: React.FC<SearchBarExtensionsProps> = React.memo((props) => {
  const { configs, portalContainer, ...dependencies } = props;

  const sortedConfigs = useMemo(() => {
    if (!configs) return [];

    const seenIds = new Set();
    configs.forEach((config) => {
      if (seenIds.has(config.id)) {
        throw new Error(`Duplicate search bar extension id '${config.id}' found.`);
      }
      seenIds.add(config.id);
    });

    return [...configs].sort((a, b) => a.order - b.order);
  }, [configs]);

  return (
    <>
      {sortedConfigs.map((config) => (
        <SearchBarExtension
          key={config.id}
          config={config}
          dependencies={dependencies}
          portalContainer={portalContainer}
        />
      ))}
    </>
  );
});

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default SearchBarExtensions;
