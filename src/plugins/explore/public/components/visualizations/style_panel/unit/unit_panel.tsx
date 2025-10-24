/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFieldText,
  EuiPopover,
  EuiContextMenu,
  EuiFormRow,
  EuiButtonIcon,
  EuiContextMenuPanelDescriptor,
} from '@elastic/eui';
import { UnitsCollection, getUnitById } from './collection';
import { StyleAccordion } from '../style_accordion';
import './style.scss';

export interface UnitPanelProps {
  unit?: string;
  onUnitChange: (unit: string | undefined) => void;
}

export const UnitPanel = ({ unit, onUnitChange }: UnitPanelProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [lastPanelId, setLastPanelId] = useState(0);

  const selectedUnit = getUnitById(unit);

  const handleChangeUnit = useCallback(
    (item: string | undefined) => {
      onUnitChange(item);
    },
    [onUnitChange]
  );

  const inputBoxButton = (
    <EuiFieldText
      id="unitPanelInput"
      placeholder="Select a unit"
      value={selectedUnit?.name ?? ''}
      onClick={() => {
        setPopover(!isPopoverOpen);
      }}
      readOnly={true}
      compressed={true}
      append={
        unit ? (
          <EuiButtonIcon
            aria-label={i18n.translate('explore.stylePanel.tabs.units.input.trash', {
              defaultMessage: 'Clear Unit Button',
            })}
            iconType="trash"
            color="subdued"
            data-test-subj="clearUnitButton"
            onClick={() => {
              handleChangeUnit(undefined);
            }}
          />
        ) : (
          <EuiButtonIcon
            aria-label={i18n.translate('explore.stylePanel.tabs.units.input.openMenu', {
              defaultMessage: 'Open Menu Button',
            })}
            color="subdued"
            iconType="arrowDown"
            data-test-subj="openMenuButton"
            onClick={() => {
              setPopover(!isPopoverOpen);
            }}
          />
        )
      }
    />
  );

  const panels = useMemo(() => {
    const all: EuiContextMenuPanelDescriptor[] = [
      {
        id: 0,
        title: 'Units',
        items: Object.entries(UnitsCollection).map(([key, val], i) => ({
          name: val.name,
          panel: i + 1,
        })),
      },
    ];

    Object.entries(UnitsCollection).forEach(([key, val], i) => {
      all.push({
        id: i + 1,
        title: val.name,
        items: val.units.map((u) => ({
          name: u.name,
          onClick: () => {
            handleChangeUnit(u.id);
            setLastPanelId(i + 1);
            setPopover(false);
          },
        })),
      });
    });

    return all;
  }, [handleChangeUnit]);

  return (
    <EuiFormRow
      fullWidth={true}
      label={i18n.translate('explore.stylePanel.unit.panel', {
        defaultMessage: 'Units',
      })}
    >
      <EuiPopover
        display="block"
        button={inputBoxButton}
        isOpen={isPopoverOpen}
        closePopover={() => setPopover(false)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        hasArrow={false}
      >
        <EuiContextMenu
          data-test-subj="unitPanelContextMenu"
          size="s"
          initialPanelId={lastPanelId}
          panels={panels}
          className="visPanelUnitPopover"
        />
      </EuiPopover>
    </EuiFormRow>
  );
};
