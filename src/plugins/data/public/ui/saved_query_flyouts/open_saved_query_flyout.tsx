/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiSearchBar,
  EuiSpacer,
  EuiTablePagination,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { SavedQuery } from '../../query';
import { SavedQueryCard } from './saved_query_card';

export interface OpenSavedQueryFlyoutProps {
  savedQueries: SavedQuery[];
  onClose: () => void;
  onQueryOpen: (query: SavedQuery) => void;
}

export function OpenSavedQueryFlyout({
  savedQueries,
  onClose,
  onQueryOpen,
}: OpenSavedQueryFlyoutProps) {
  const [shouldRunOnOpen, setShouldRunOnOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | undefined>(undefined);

  return (
    <EuiFlyout onClose={onClose} hideCloseButton>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h3>Saved queries</h3>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiSearchBar
          box={{
            placeholder: 'Search saved query',
          }}
          filters={[
            {
              type: 'is',
              field: '',
              name: 'Query language',
            },
          ]}
        />
        <EuiSpacer />
        {savedQueries.length > 0 ? (
          savedQueries.map((query) => (
            <SavedQueryCard
              savedQuery={query}
              selectedQuery={selectedQuery}
              onSelect={setSelectedQuery}
            />
          ))
        ) : (
          <EuiEmptyPrompt content={'No saved query present'} />
        )}
        <EuiSpacer />
        <EuiTablePagination />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType={'cross'} color="danger" iconSide="left" onClick={onClose}>
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiCheckbox
                  id="run-saved-query-automatically"
                  checked={shouldRunOnOpen}
                  onChange={(event) => {
                    setShouldRunOnOpen(event.target.checked);
                  }}
                  label={'Run automatically'}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  disabled={!selectedQuery}
                  fill
                  onClick={() => {
                    if (selectedQuery) {
                      onQueryOpen(selectedQuery);
                      onClose();
                    }
                  }}
                >
                  Open query
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
