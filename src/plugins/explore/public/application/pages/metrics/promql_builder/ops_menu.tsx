/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiContextMenu, EuiFlexItem, EuiPopover, EuiText } from '@elastic/eui';
import { BuilderAction } from './build_promql';
import { OPERATION_CATEGORIES } from './operation_categories';

interface OpsMenuProps {
  hasRange: boolean;
  dispatch: React.Dispatch<BuilderAction>;
}

export const OpsMenu: React.FC<OpsMenuProps> = ({ hasRange, dispatch }) => {
  const [isOpen, setIsOpen] = useState(false);

  const panels = useMemo(
    () => [
      {
        id: 0,
        items: [
          ...(!hasRange
            ? [
                {
                  name: i18n.translate('explore.promqlBuilder.addRange', {
                    defaultMessage: 'Add range',
                  }),
                  onClick: () => {
                    dispatch({ type: 'SET_RANGE', range: '5m' });
                    setIsOpen(false);
                  },
                },
              ]
            : []),
          ...OPERATION_CATEGORIES.map((cat, i) => ({
            name: cat.name,
            panel: i + 1,
          })),
        ],
      },
      ...OPERATION_CATEGORIES.map((cat, i) => ({
        id: i + 1,
        title: cat.name,
        items: cat.items.map((item) => ({
          name: (
            <div>
              <strong>{item.name}</strong>
              <EuiText size="xs" color="subdued" className="pqbOpsMenuDescription">
                {item.description}
              </EuiText>
            </div>
          ),
          onClick: () => {
            dispatch({
              type: 'ADD_OPERATION',
              operation: { id: item.id, name: item.name, params: [...item.params] },
            });
            setIsOpen(false);
          },
        })),
      })),
    ],
    [hasRange, dispatch]
  );

  return (
    <EuiFlexItem grow={false}>
      <EuiPopover
        button={
          <EuiButtonIcon
            iconType="boxesVertical"
            aria-label={i18n.translate('explore.promqlBuilder.addOperation', {
              defaultMessage: 'Add operation',
            })}
            size="s"
            onClick={() => setIsOpen(!isOpen)}
          />
        }
        isOpen={isOpen}
        closePopover={() => setIsOpen(false)}
        panelPaddingSize="none"
        panelClassName="pqbOpsMenuPanel"
        anchorPosition="downRight"
      >
        <EuiContextMenu initialPanelId={0} panels={panels} size="s" />
      </EuiPopover>
    </EuiFlexItem>
  );
};
