/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiTable,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface MatchingIndicesListProps {
  matchingIndices: string[];
  customPrefix: string;
}

export const MatchingIndicesList: React.FC<MatchingIndicesListProps> = ({
  matchingIndices,
  customPrefix,
}) => {
  const highlightIndexName = (indexName: string, queryPattern: string): React.ReactNode => {
    // Remove wildcards from query for highlighting
    const queryWithoutWildcard = queryPattern.replace(/\*/g, '');
    const queryIdx = indexName.indexOf(queryWithoutWildcard);

    if (!queryWithoutWildcard || queryIdx === -1) {
      return indexName;
    }

    const preStr = indexName.substring(0, queryIdx);
    const postStr = indexName.substring(queryIdx + queryWithoutWildcard.length);

    return (
      <span>
        {preStr}
        <strong>{queryWithoutWildcard}</strong>
        {postStr}
      </span>
    );
  };

  // Early return if no matching indices
  if (matchingIndices.length === 0) {
    return null;
  }

  const rows = matchingIndices.map((indexName, key) => (
    <EuiTableRow key={key}>
      <EuiTableRowCell>
        <EuiText size="s">{highlightIndexName(indexName, customPrefix)}</EuiText>
      </EuiTableRowCell>
    </EuiTableRow>
  ));

  return (
    <EuiFlexGroup direction="column" gutterSize="none" style={{ maxHeight: '300px' }}>
      <EuiFlexItem grow={false}>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <strong>
            <FormattedMessage
              id="data.datasetService.matchingIndicesList.matchingIndicesCount"
              defaultMessage="{count, plural, one {# matching index:} other {# matching indices:}}"
              values={{ count: matchingIndices.length }}
            />
          </strong>
        </EuiText>
        <EuiSpacer size="xs" />
      </EuiFlexItem>
      <EuiFlexItem style={{ minHeight: 0, height: '100%', overflowY: 'auto' }}>
        <EuiTable responsive={false} tableLayout="auto">
          <EuiTableBody>{rows}</EuiTableBody>
        </EuiTable>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
