/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataStructureCreatorProps,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../../common';
import { IndexSelector } from './index_selector';
import './index_data_structure_creator.scss';

export const IndexDataStructureCreator: React.FC<
  DataStructureCreatorProps & { services?: any }
> = ({ path, index, selectDataStructure, services }) => {
  const current = path[index];
  const isLast = index === path.length - 1;
  const isFinal = isLast && !current.hasNext;

  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleIndexSelectionChange = (selectedId: string | null, isWildcardPattern?: boolean) => {
    if (selectedId) {
      const item = (current.children || []).find((child: DataStructure) => child.id === selectedId);
      if (item) {
        if (isFinal) {
          setSelectedIndexId(selectedId);
        }
        selectDataStructure(item, path.slice(0, index + 1));
      }
    } else {
      if (isFinal) {
        setSelectedIndexId(null);
        // If no specific selection but there's a search query, create a virtual dataset
        if (searchQuery && searchQuery.trim().length > 0) {
          createVirtualDatasetFromPattern(searchQuery.trim());
        }
      }
    }
  };

  const createVirtualDatasetFromPattern = (pattern: string) => {
    // Create a virtual dataset structure for the pattern
    const dataSourceId = path.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
    const virtualDataStructure: DataStructure = {
      id: `${dataSourceId}::${pattern}`,
      title: pattern,
      type: 'INDEX',
      meta: {
        type: DATA_STRUCTURE_META_TYPES.CUSTOM,
        isWildcardPattern: pattern.includes('*'),
      },
    };

    selectDataStructure(virtualDataStructure, path.slice(0, index + 1));
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    // If there's no specific selection but there's a search query, create virtual dataset
    if (!selectedIndexId && query && query.trim().length > 0) {
      createVirtualDatasetFromPattern(query.trim());
    }
  };

  return (
    <div className="indexDataStructureCreator">
      <EuiText size="s" color="subdued">
        <FormattedMessage
          id="data.datasetService.indexDataStructureCreator.specifyDataScopeDescription"
          defaultMessage="Specify a data scope by making a selection to narrow down your data."
        />
      </EuiText>

      <EuiSpacer size="s" />

      <IndexSelector
        children={current.children}
        selectedIndexId={selectedIndexId}
        isFinal={isFinal}
        onSelectionChange={handleIndexSelectionChange}
        onSearchQueryChange={handleSearchQueryChange}
        httpService={services?.http}
      />
    </div>
  );
};
