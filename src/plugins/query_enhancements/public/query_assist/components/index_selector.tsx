/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBox, EuiComboBoxOptionOption, EuiText } from '@elastic/eui';
import React from 'react';
import { useIndexPatterns, useIndices } from '../hooks/use_indices';

interface IndexSelectorProps {
  dataSourceId?: string;
  selectedIndex?: string;
  setSelectedIndex: React.Dispatch<React.SetStateAction<string>>;
}

// TODO this is a temporary solution, there will be a dataset selector from discover
export const IndexSelector: React.FC<IndexSelectorProps> = (props) => {
  const { data: indices, loading: indicesLoading } = useIndices(props.dataSourceId);
  const { data: indexPatterns, loading: indexPatternsLoading } = useIndexPatterns();
  const loading = indicesLoading || indexPatternsLoading;
  const indicesAndIndexPatterns =
    indexPatterns && indices
      ? [...indexPatterns, ...indices].filter(
          (v1, index, array) => array.findIndex((v2) => v1 === v2) === index
        )
      : [];
  const options: EuiComboBoxOptionOption[] = indicesAndIndexPatterns.map((index) => ({
    label: index,
  }));
  const selectedOptions = props.selectedIndex ? [{ label: props.selectedIndex }] : undefined;

  return (
    <EuiComboBox
      style={{ width: 500 }}
      placeholder="Select an index"
      isClearable={false}
      prepend={<EuiText>Index</EuiText>}
      singleSelection={{ asPlainText: true }}
      isLoading={loading}
      options={options}
      selectedOptions={selectedOptions}
      onChange={(index) => {
        props.setSelectedIndex(index[0].label);
      }}
    />
  );
};
