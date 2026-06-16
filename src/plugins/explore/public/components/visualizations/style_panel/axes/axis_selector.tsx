/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useState } from 'react';
import {
  EuiButtonIcon,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSelectableOption,
  EuiToken,
} from '@elastic/eui';

import { AxisRole, VisFieldType } from '../../types';

import './axis_selector.scss';

const SCHEMA_TOKEN_MAP: Record<string, string> = {
  [VisFieldType.Numerical]: 'tokenNumber',
  [VisFieldType.Categorical]: 'tokenString',
  [VisFieldType.Date]: 'tokenDate',
};

interface AxisSelectorProps {
  axisRole: AxisRole;
  value: string;
  options: Array<EuiSelectableOption & { schema?: VisFieldType }>;
  onChange: (axisRole: AxisRole, value: string) => void;
  onRemove: (axisRole: AxisRole) => void;
}

export const AxisSelector = ({
  value,
  options,
  axisRole,
  onChange,
  onRemove,
}: AxisSelectorProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => setIsPopoverOpen((isOpen) => !isOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const onSelectionChange = useCallback(
    (opts: EuiSelectableOption[]) => {
      const found = opts.find((opt) => opt.checked);
      if (found) {
        onChange(axisRole, found.label);
      } else {
        onRemove(axisRole);
      }
      closePopover();
    },
    [axisRole, onChange, onRemove]
  );

  const allOptions = useMemo(() => {
    const all: EuiSelectableOption[] = [];
    for (const opt of options) {
      const schema = opt.schema;
      const tokenType = schema ? SCHEMA_TOKEN_MAP[schema] : undefined;
      const append = tokenType ? (
        <EuiToken style={{ display: 'flex' }} size="s" iconType={tokenType} />
      ) : undefined;
      if (opt.label === value) {
        all.push({ ...opt, checked: 'on', append });
      } else {
        all.push({ ...opt, checked: undefined, append });
      }
    }
    return all;
  }, [options, value]);

  const hasValue = Boolean(value);

  const button = (
    <button
      data-test-subj="axisSelectorButton"
      className="axisSelectorButton"
      onClick={onButtonClick}
    >
      {hasValue ? value : 'Select a field'}
    </button>
  );

  return (
    <div className={`axisSelectorContainer${hasValue ? '' : ' axisSelectorContainer--empty'}`}>
      <div className="axisSelectorRow">
        <EuiPopover
          className="axisSelectorFieldSelector"
          button={button}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
          display="block"
        >
          <EuiSelectable
            searchable
            singleSelection
            className="axisSelectorList"
            options={allOptions}
            onChange={onSelectionChange}
            searchProps={{
              placeholder: 'Filter list',
              compressed: true,
            }}
            listProps={{ onFocusBadge: false }}
          >
            {(list, search) => {
              return (
                <>
                  <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
                  {list}
                </>
              );
            }}
          </EuiSelectable>
        </EuiPopover>
        {hasValue && (
          <EuiButtonIcon
            className="axisSelectorRemoveButton"
            iconType="cross"
            iconSize="s"
            color="text"
            aria-label="Remove field"
            data-test-subj="axisSelectorRemoveButton"
            onClick={() => onRemove(axisRole)}
          />
        )}
      </div>
    </div>
  );
};
