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
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import './matching_indices_list.scss';

interface MatchingIndicesListProps {
  matchingIndices: string[];
  customPrefix: string;
  isLoading?: boolean;
}

export const MatchingIndicesList: React.FC<MatchingIndicesListProps> = ({
  matchingIndices,
  customPrefix,
  isLoading = false,
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

  // Show loading spinner when fetching indices
  if (isLoading) {
    return (
      <EuiFlexGroup
        className="matchingIndicesList"
        direction="column"
        gutterSize="none"
        alignItems="center"
        justifyContent="center"
      >
        <EuiFlexItem grow={false}>
          <EuiSpacer size="m" />
          <EuiLoadingSpinner size="l" />
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            <FormattedMessage
              id="data.datasetService.matchingIndicesList.loadingMessage"
              defaultMessage="Loading matching indices..."
            />
          </EuiText>
          <EuiSpacer size="m" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

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
    <EuiFlexGroup className="matchingIndicesList" direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <strong>
            {customPrefix === '*' ? (
              <FormattedMessage
                id="data.datasetService.matchingIndicesList.allIndicesPreview"
                defaultMessage="All indices:"
              />
            ) : (
              <FormattedMessage
                id="data.datasetService.matchingIndicesList.matchingIndicesCount"
                defaultMessage="{count, plural, one {# matching index:} other {# matching indices:}}"
                values={{ count: matchingIndices.length }}
              />
            )}
          </strong>
        </EuiText>
        <EuiSpacer size="xs" />
      </EuiFlexItem>
      <EuiFlexItem className="matchingIndicesList__scrollable">
        <EuiTable responsive={false} tableLayout="auto">
          <EuiTableBody>{rows}</EuiTableBody>
        </EuiTable>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
