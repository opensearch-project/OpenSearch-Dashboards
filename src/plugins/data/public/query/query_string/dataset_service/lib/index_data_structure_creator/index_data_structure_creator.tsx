/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataStructureCreatorProps,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../../common';
import { ModeSelectionRow } from './mode_selection_row';
import { MatchingIndicesList } from './matching_indices_list';
import { validatePrefix, canAppendWildcard } from './index_data_structure_creator_utils';
import './index_data_structure_creator.scss';

type SelectionMode = 'single' | 'prefix';

export const IndexDataStructureCreator: React.FC<DataStructureCreatorProps> = ({
  path,
  index,
  selectDataStructure,
}) => {
  const current = path[index];
  const isLast = index === path.length - 1;
  const isFinal = isLast && !current.hasNext;

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [customPrefix, setCustomPrefix] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const [appendedWildcard, setAppendedWildcard] = useState(false);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);

  // Filter indices that match the custom prefix pattern
  const matchingIndices = useMemo(() => {
    if (selectionMode !== 'prefix' || !customPrefix) {
      return [];
    }

    const children = current.children || [];
    const pattern = customPrefix.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`, 'i');

    return children.filter((child) => regex.test(child.title)).map((child) => child.title);
  }, [selectionMode, customPrefix, current.children]);

  const handleModeChange = (selectedOptions: Array<{ label: string; value?: string }>) => {
    if (selectedOptions.length > 0 && selectedOptions[0].value) {
      const newMode = selectedOptions[0].value as SelectionMode;
      setSelectionMode(newMode);

      if (newMode === 'prefix') {
        setCustomPrefix('*');
      } else {
        setCustomPrefix('');
      }

      setValidationError('');
      setAppendedWildcard(false);
    }
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    let value = target.value;

    // Auto-append wildcard when user types a single alphanumeric character
    // Places cursor before the wildcard for continued typing
    if (value.length === 1 && canAppendWildcard(value)) {
      value += '*';
      setAppendedWildcard(true);
      setTimeout(() => target.setSelectionRange(1, 1));
    } else {
      if (value === '*' && appendedWildcard) {
        value = '';
        setAppendedWildcard(false);
      }
    }

    setCustomPrefix(value);

    const error = validatePrefix(value);
    setValidationError(error);

    if (!error && value.trim()) {
      const children = current.children || [];
      const pattern = value.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`, 'i');
      const matches = children.filter((child) => regex.test(child.title));

      if (matches.length === 0) {
        setValidationError(
          i18n.translate('data.datasetService.indexDataStructureCreator.noIndicesMatchError', {
            defaultMessage: 'No indices match this prefix pattern',
          })
        );
      } else {
        const dataSourceId = path.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
        const customDataStructure: DataStructure = {
          id: `${dataSourceId}::${value}`,
          title: value,
          type: 'INDEX',
          meta: {
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            isCustomPrefix: true,
            matchingIndicesCount: matches.length,
          },
        };

        selectDataStructure(customDataStructure, path.slice(0, index + 1));
      }
    }
  };

  const handleIndexSelectionChange = (selectedId: string | null) => {
    if (selectedId) {
      const item = current.children?.find((child) => child.id === selectedId);
      if (item) {
        if (isFinal) {
          setSelectedIndexId(selectedId);
        }
        selectDataStructure(item, path.slice(0, index + 1));
      }
    } else {
      if (isFinal) {
        setSelectedIndexId(null);
      }
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

      <ModeSelectionRow
        selectionMode={selectionMode}
        onModeChange={handleModeChange}
        customPrefix={customPrefix}
        validationError={validationError}
        onPrefixChange={handlePrefixChange}
        children={current.children}
        selectedIndexId={selectedIndexId}
        isFinal={isFinal}
        onIndexSelectionChange={handleIndexSelectionChange}
      />

      <EuiSpacer size="s" />

      {selectionMode === 'prefix' && (
        <MatchingIndicesList matchingIndices={matchingIndices} customPrefix={customPrefix} />
      )}
    </div>
  );
};
