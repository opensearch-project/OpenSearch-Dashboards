/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiSearchBar,
  EuiSearchBarProps,
  EuiSpacer,
  EuiTablePagination,
  EuiTitle,
  Pager,
} from '@elastic/eui';
import React, { useRef, useState } from 'react';
import { SavedQuery } from '../../query';
import { SavedQueryCard } from './saved_query_card';

export interface OpenSavedQueryFlyoutProps {
  savedQueries: SavedQuery[];
  onClose: () => void;
  onQueryOpen: (query: SavedQuery) => void;
}

interface SavedQuerySearchableItem {
  id: string;
  title: string;
  description: string;
  language: string;
}

export function OpenSavedQueryFlyout({
  savedQueries,
  onClose,
  onQueryOpen,
}: OpenSavedQueryFlyoutProps) {
  // const [shouldRunOnOpen, setShouldRunOnOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState(EuiSearchBar.Query.MATCH_ALL);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pager = useRef(new Pager(savedQueries.length, itemsPerPage));
  const [firstItemIndex, setFirstItemIndex] = useState(pager.current.getFirstItemIndex());
  const [lastItemIndex, setLastItemIndex] = useState(pager.current.getLastItemIndex());

  const onChange: EuiSearchBarProps['onChange'] = ({ query, error }) => {
    if (!error) {
      setSearchQuery(query);
      pager.current.goToPageIndex(0);
      setFirstItemIndex(pager.current.getFirstItemIndex());
      setLastItemIndex(pager.current.getLastItemIndex());
    }
  };

  const schema = {
    strict: true,
    fields: {
      title: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      language: {
        type: 'string',
      },
    },
  };

  const queryMap: {
    [id: string]: { savedQuery: SavedQuery; savedQuerySearchableItem: SavedQuerySearchableItem };
  } = {};
  const queryLanguageSet = new Set<string>();
  savedQueries.forEach((q) => {
    queryLanguageSet.add(q.attributes.query.language);
    queryMap[q.id] = {
      savedQuery: q,
      savedQuerySearchableItem: {
        id: q.id,
        title: q.attributes.title,
        description: q.attributes.description,
        language: q.attributes.query.language,
      },
    };
  });

  const filteredSavedQueries = EuiSearchBar.Query.execute(
    searchQuery,
    Object.values(queryMap).map((obj) => obj.savedQuerySearchableItem),
    {
      defaultFields: ['language', 'title', 'description'],
    }
  );

  pager.current.setTotalItems(filteredSavedQueries.length);
  const queriesOnCurrentPage = filteredSavedQueries.slice(firstItemIndex, lastItemIndex + 1);

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
            incremental: true,
            schema,
          }}
          filters={[
            {
              type: 'field_value_selection',
              field: 'language',
              name: 'Query language',
              multiSelect: 'or',
              options: Array.from(queryLanguageSet).map((language) => ({
                value: language,
                view: language.toUpperCase(),
              })),
            },
          ]}
          onChange={onChange}
        />
        <EuiSpacer />
        {queriesOnCurrentPage.length > 0 ? (
          queriesOnCurrentPage.map((query) => (
            <SavedQueryCard
              key={query.id}
              savedQuery={queryMap[query.id].savedQuery}
              selectedQuery={selectedQuery}
              onSelect={setSelectedQuery}
              onRunPreview={onQueryOpen}
              onClose={onClose}
            />
          ))
        ) : (
          <EuiEmptyPrompt content={'No saved query present'} />
        )}
        <EuiSpacer />
        <EuiTablePagination
          itemsPerPageOptions={[5, 10, 20]}
          itemsPerPage={itemsPerPage}
          activePage={pager.current.getCurrentPageIndex()}
          pageCount={pager.current.getTotalPages()}
          onChangeItemsPerPage={(pageSize) => {
            pager.current.setItemsPerPage(pageSize);
            setItemsPerPage(pageSize);
            setFirstItemIndex(pager.current.getFirstItemIndex());
            setLastItemIndex(pager.current.getLastItemIndex());
          }}
          onChangePage={(pageIndex) => {
            pager.current.goToPageIndex(pageIndex);
            setFirstItemIndex(pager.current.getFirstItemIndex());
            setLastItemIndex(pager.current.getLastItemIndex());
          }}
        />
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
              {/* <EuiFlexItem grow={false}>
                <EuiCheckbox
                  id="run-saved-query-automatically"
                  checked={shouldRunOnOpen}
                  onChange={(event) => {
                    setShouldRunOnOpen(event.target.checked);
                  }}
                  label={'Run automatically'}
                />
              </EuiFlexItem> */}
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
