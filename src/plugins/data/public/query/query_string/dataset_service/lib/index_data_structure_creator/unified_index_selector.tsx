/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  EuiSelectable,
  EuiSelectableOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiFormRow,
  EuiIcon,
  EuiText,
  EuiPopover,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';
import { useIndexFetcher } from './use_index_fetcher';
import { MAX_INITIAL_RESULTS } from './constants';
import { canAppendWildcard } from './index_data_structure_creator_utils';
import './unified_index_selector.scss';

interface UnifiedIndexSelectorProps {
  selectedItems: Array<{ id: string; title: string; isWildcard: boolean }>;
  onSelectionChange: (items: Array<{ id: string; title: string; isWildcard: boolean }>) => void;
  services?: IDataPluginServices;
  path?: DataStructure[];
}

// Note: * is NOT in this list because it's used for wildcards
const ILLEGAL_CHARACTERS_VISIBLE = ['\\', '/', '?', '"', '<', '>', '|', ':', '+', '#', ','];

export const UnifiedIndexSelector: React.FC<UnifiedIndexSelectorProps> = ({
  selectedItems,
  onSelectionChange,
  services,
  path,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [appendedWildcard, setAppendedWildcard] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);
  const shouldRepositionCursor = useRef(false);

  // Use shared hook for fetching indices
  const { fetchIndices: fetchIndicesFromHook } = useIndexFetcher({ services, path });

  // Validate pattern for illegal characters
  const validatePattern = (inputPattern: string): string[] => {
    const illegalChars = ILLEGAL_CHARACTERS_VISIBLE.filter((char) => inputPattern.includes(char));

    // Check for spaces
    if (inputPattern.includes(' ')) {
      illegalChars.push('space');
    }

    return illegalChars;
  };

  // Get validation error message
  const getValidationErrorMessage = (errors: string[]): string => {
    if (errors.length === 0) return '';

    const hasSpace = errors.includes('space');
    const otherChars = errors.filter((e) => e !== 'space');

    let message = '';

    if (hasSpace && otherChars.length > 0) {
      const characterList = otherChars.join(', ');
      message = i18n.translate(
        'data.datasetService.unifiedSelector.illegalCharactersErrorWithSpace',
        {
          defaultMessage: 'Spaces and the characters {characterList} are not allowed.',
          values: { characterList },
        }
      );
    } else if (hasSpace) {
      message = i18n.translate('data.datasetService.unifiedSelector.spacesNotAllowed', {
        defaultMessage: 'Spaces are not allowed.',
      });
    } else {
      const characterList = otherChars.join(', ');
      message = i18n.translate('data.datasetService.unifiedSelector.illegalCharactersError', {
        defaultMessage: 'The characters {characterList} are not allowed.',
        values: { characterList },
      });
    }

    return message;
  };

  // Fetch indices matching search using shared hook
  const fetchIndices = useCallback(
    async (search: string, limit?: number) => {
      if (!search || search.trim() === '') {
        setSearchResults([]);
        setTotalCount(0);
        return;
      }

      setIsLoading(true);

      try {
        // Use wildcard pattern for search
        const searchPattern = search.includes('*') ? search : `*${search}*`;

        // Fetch indices using shared hook
        const allIndices = await fetchIndicesFromHook({
          patterns: [searchPattern],
          limit: undefined,
        });

        // Set total count
        setTotalCount(allIndices.length);

        // Apply limit if specified
        if (limit && allIndices.length > limit) {
          setSearchResults(allIndices.slice(0, limit));
        } else {
          setSearchResults(allIndices);
        }
      } catch (error) {
        setSearchResults([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchIndicesFromHook]
  );

  // Load initial results on mount
  useEffect(() => {
    if (!hasLoadedInitial.current && services?.http) {
      hasLoadedInitial.current = true;
      fetchIndices('*', MAX_INITIAL_RESULTS);
    }
  }, [services, fetchIndices]);

  // Debounced search
  useEffect(() => {
    if (!searchValue || searchValue.trim() === '') {
      if (hasLoadedInitial.current) {
        fetchIndices('*', MAX_INITIAL_RESULTS);
      }
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchIndices(searchValue);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, fetchIndices]);

  // Auto-focus input on first mount to open dropdown
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Reposition cursor after wildcard is auto-appended
  useEffect(() => {
    if (shouldRepositionCursor.current && inputRef.current) {
      shouldRepositionCursor.current = false;
      // Position cursor after the first character (before the wildcard)
      inputRef.current.setSelectionRange(1, 1);
    }
  }, [searchValue]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    let value = target.value;

    // Auto-append wildcard when user types a single alphanumeric character
    if (value.length === 1 && canAppendWildcard(value)) {
      value += '*';
      setAppendedWildcard(true);
      // Signal that cursor should be repositioned after state update
      shouldRepositionCursor.current = true;
    } else {
      if (value === '*' && appendedWildcard) {
        value = '';
        setAppendedWildcard(false);
      }
    }

    setSearchValue(value);
    setValidationErrors(validatePattern(value));

    // Open popover when typing
    if (!isPopoverOpen) {
      setIsPopoverOpen(true);
    }
  };

  const handleAddPattern = () => {
    const trimmed = searchValue.trim();
    if (!trimmed || validationErrors.length > 0) return;

    const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
    const itemId = `${dataSourceId}::${trimmed}`;

    // Check if already in list
    if (selectedItems.some((item) => item.title === trimmed)) {
      return;
    }

    const newItem = {
      id: itemId,
      title: trimmed,
      isWildcard: trimmed.includes('*'),
    };

    const newItems = [...selectedItems, newItem];
    onSelectionChange(newItems);
    setSearchValue('');
    setAppendedWildcard(false);
    setValidationErrors([]);
  };

  const handleSelectFromDropdown = (indexName: string) => {
    const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
    const itemId = `${dataSourceId}::${indexName}`;

    // Check if already in list
    if (selectedItems.some((item) => item.title === indexName)) {
      return;
    }

    const newItem = {
      id: itemId,
      title: indexName,
      isWildcard: false,
    };

    const newItems = [...selectedItems, newItem];
    onSelectionChange(newItems);
    // Keep popover open to allow multiple selections
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim() && searchValue.includes('*')) {
      e.preventDefault();
      handleAddPattern();
      setIsPopoverOpen(false);
      inputRef.current?.blur();
    }
  };

  // Create options from search results
  const displayOptions: EuiSelectableOption[] = searchResults.map((indexName) => {
    const isSelected = selectedItems.some((item) => item.title === indexName);
    return {
      label: indexName,
      key: indexName,
      checked: undefined,
      prepend: isSelected ? <EuiIcon type="check" color="success" /> : undefined,
      append: (
        <EuiText size="xs" color="subdued">
          {i18n.translate('data.datasetService.unifiedSelector.addSingleIndex', {
            defaultMessage: 'Add single index',
          })}
        </EuiText>
      ),
    };
  });

  const onChange = (newOptions: EuiSelectableOption[]) => {
    // Find newly selected option
    const selectedOption = newOptions.find((option) => option.checked === 'on');
    if (selectedOption && selectedOption.label) {
      handleSelectFromDropdown(selectedOption.label);
    }
  };

  const hasWildcard = searchValue.includes('*');
  const canAddPattern = searchValue.trim() && hasWildcard && validationErrors.length === 0;
  const hasValidationErrors = validationErrors.length > 0;
  const errorMessage = getValidationErrorMessage(validationErrors);

  return (
    <div className="unifiedIndexSelector">
      <EuiText size="s" color="subdued">
        {i18n.translate('data.datasetService.unifiedSelector.helpText', {
          defaultMessage:
            'Click indices to add them, or enter wildcards (e.g., otel*) and use Add wildcard button',
        })}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFormRow
        isInvalid={hasValidationErrors}
        error={hasValidationErrors ? errorMessage : undefined}
        fullWidth
      >
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem>
            <EuiPopover
              button={
                <EuiFieldText
                  inputRef={inputRef}
                  data-test-subj="unified-index-selector-search"
                  placeholder={i18n.translate(
                    'data.datasetService.unifiedSelector.searchPlaceholder',
                    {
                      defaultMessage: 'Search indices or enter wildcard pattern',
                    }
                  )}
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsPopoverOpen(true)}
                  isInvalid={hasValidationErrors}
                  fullWidth
                />
              }
              isOpen={isPopoverOpen}
              closePopover={() => setIsPopoverOpen(false)}
              panelPaddingSize="none"
              anchorPosition="downCenter"
              display="block"
              ownFocus={false}
            >
              <div data-test-subj="unified-index-selector-dropdown" style={{ width: '550px' }}>
                {!searchValue && totalCount > MAX_INITIAL_RESULTS && searchResults.length > 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: '#69707D' }}>
                    {i18n.translate('data.datasetService.unifiedSelector.limitedResultsMessage', {
                      defaultMessage:
                        'Showing first {displayed} of {total} indices. Type to search for more.',
                      values: { displayed: searchResults.length, total: totalCount },
                    })}
                  </div>
                )}
                <EuiSelectable
                  data-test-subj="unified-index-selector-list"
                  options={displayOptions}
                  onChange={onChange}
                  singleSelection={true}
                  searchable={false}
                  isLoading={isLoading}
                  loadingMessage={i18n.translate(
                    'data.datasetService.unifiedSelector.loadingMessage',
                    {
                      defaultMessage: 'Loading indices...',
                    }
                  )}
                  emptyMessage={
                    searchValue
                      ? i18n.translate('data.datasetService.unifiedSelector.noResultsMessage', {
                          defaultMessage: 'No indices found matching "{search}"',
                          values: { search: searchValue },
                        })
                      : i18n.translate(
                          'data.datasetService.unifiedSelector.loadingInitialMessage',
                          {
                            defaultMessage: 'Loading indices...',
                          }
                        )
                  }
                  height={200}
                  listProps={{
                    bordered: false,
                    style: { maxHeight: '200px' },
                  }}
                >
                  {(list) => list}
                </EuiSelectable>
              </div>
            </EuiPopover>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="unified-index-selector-add-button"
              size="s"
              onClick={handleAddPattern}
              disabled={!canAddPattern}
            >
              {i18n.translate('data.datasetService.unifiedSelector.addButton', {
                defaultMessage: 'Add wildcard',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
    </div>
  );
};
