/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiModal,
  EuiModalBody,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  GlobalSearchCommand,
  SearchCommandKeyTypes,
  SearchCommandTypes,
} from '../../global_search';

interface SearchModalProps {
  globalSearchCommands: GlobalSearchCommand[];
  onClose: () => void;
}

export const SearchModal = ({ globalSearchCommands, onClose }: SearchModalProps) => {
  const [results, setResults] = useState([] as JSX.Element[]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const enterKeyDownRef = useRef(false);
  const searchBarInputRef = useRef<HTMLInputElement | null>(null);
  const ongoingAbortControllersRef = useRef<Array<{ controller: AbortController; query: string }>>(
    []
  );

  useEffect(() => {
    // Auto-focus the search input when modal opens
    setTimeout(() => {
      searchBarInputRef.current?.focus();
    }, 0);
  }, []);

  const resultSection = (items: ReactNode[], sectionHeader: string | undefined) => {
    return (
      <EuiFlexGroup direction="column" gutterSize="xs" key={sectionHeader}>
        {sectionHeader && (
          <EuiFlexItem>
            <EuiTitle size="s">
              <EuiText size="xs" color="subdued">
                {sectionHeader}
              </EuiText>
            </EuiTitle>
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          {items.length ? (
            <EuiListGroup flush={true} gutterSize="none" maxWidth={false}>
              {items.map((item, index) => (
                <EuiListGroupItem key={index} label={item} color="text" style={{ padding: 0 }} />
              ))}
            </EuiListGroup>
          ) : (
            <EuiText color="subdued" size="xs">
              {i18n.translate('core.globalSearch.emptyResult.description', {
                defaultMessage: 'No results found.',
              })}
            </EuiText>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const onSearch = useCallback(
    async (value: string) => {
      const abortController = new AbortController();
      ongoingAbortControllersRef.current.push({ controller: abortController, query: value });
      if (enterKeyDownRef.current) {
        globalSearchCommands.forEach((command) => {
          command.action?.({
            content: value,
          });
        });
        enterKeyDownRef.current = false;
        setSearchValue('');
        onClose();
        return;
      }

      const commandsWithoutActions = globalSearchCommands.filter(
        (command) => command.type !== 'ACTIONS'
      );

      const filteredCommands = commandsWithoutActions.filter((command) => {
        const alias = SearchCommandTypes[command.type].alias;
        return alias && value.startsWith(alias);
      });

      const defaultSearchCommands = commandsWithoutActions.filter((command) => {
        return !SearchCommandTypes[command.type].alias;
      });

      if (filteredCommands.length === 0) {
        filteredCommands.push(...defaultSearchCommands);
      }

      filteredCommands.push(
        ...globalSearchCommands.filter((command) => command.type === 'ACTIONS')
      );

      if (value && filteredCommands && filteredCommands.length) {
        setIsLoading(true);
        const settleResults = await Promise.allSettled(
          filteredCommands.map((command) => {
            const alias = SearchCommandTypes[command.type].alias;
            const queryValue = alias ? value.replace(alias, '').trim() : value;
            return command
              .run(queryValue, onClose, { abortSignal: abortController.signal })
              .then((items) => {
                return { items, type: command.type };
              });
          })
        );
        const searchResults = settleResults
          .filter((result) => result.status === 'fulfilled')
          .map(
            (result) =>
              (result as PromiseFulfilledResult<{
                items: ReactNode[];
                type: SearchCommandKeyTypes;
              }>).value
          )
          .reduce((acc, { items, type }) => {
            return {
              ...acc,
              [type]: (acc[type] || []).concat(items),
            };
          }, {} as Record<SearchCommandKeyTypes, ReactNode[]>);
        const sections = Object.entries(searchResults).map(([key, items]) => {
          const sectionHeader = SearchCommandTypes[key as SearchCommandKeyTypes].description;
          return resultSection(items, key !== 'ACTIONS' ? sectionHeader : undefined);
        });
        if (abortController.signal.aborted) {
          return;
        }
        setIsLoading(false);
        setResults(sections);
        do {
          const currentItem = ongoingAbortControllersRef.current.shift();
          if (currentItem?.controller === abortController) {
            break;
          }
          currentItem?.controller?.abort('Previous search results filled');
        } while (ongoingAbortControllersRef.current.length > 0);
      } else {
        setResults([]);
      }
    },
    [globalSearchCommands, onClose]
  );

  return (
    <EuiModal
      onClose={onClose}
      maxWidth={640}
      data-test-subj="searchModal"
      style={{ minHeight: '400px' }}
    >
      <EuiModalBody>
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiFieldSearch
              compressed
              incremental
              onSearch={onSearch}
              fullWidth
              placeholder={
                globalSearchCommands.find((item) => item.inputPlaceholder)?.inputPlaceholder ??
                i18n.translate('core.globalSearch.input.placeholder', {
                  defaultMessage: 'Search menu or assets',
                })
              }
              isLoading={isLoading}
              aria-label="Search"
              data-test-subj="searchModal-input"
              inputRef={(input) => {
                searchBarInputRef.current = input;
              }}
              value={searchValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  enterKeyDownRef.current = true;
                }
              }}
              onChange={(e) => {
                setSearchValue(e.currentTarget.value);
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none">
              {results && results.length ? (
                <EuiFlexGroup direction="column" gutterSize="none">
                  {results.map((result) => (
                    <EuiFlexItem key={result.key}>{result}</EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              ) : searchValue ? (
                <EuiText color="subdued" size="xs">
                  {i18n.translate('core.globalSearch.emptyResult.description', {
                    defaultMessage: 'No results found.',
                  })}
                </EuiText>
              ) : (
                <EuiText color="subdued" size="xs">
                  {i18n.translate('core.globalSearch.modal.hint', {
                    defaultMessage: 'Start typing to search...',
                  })}
                </EuiText>
              )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>
    </EuiModal>
  );
};
