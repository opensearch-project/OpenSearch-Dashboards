/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFieldText, EuiPopover, EuiContextMenu, EuiFormRow, EuiButtonIcon } from '@elastic/eui';
import { UnitsCollection, getUnitById } from './collection';
import { StyleAccordion } from '../style_accordion';
import './style.scss';

export interface UnitPanelProps {
  unit?: string;
  onUnitChange: (unit: string | undefined) => void;
}

export const UnitPanel = ({ unit, onUnitChange }: UnitPanelProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [popoverWidth, setPopoverWidth] = useState(0);
  const [lastPanelId, setLastPanelId] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedUnit = getUnitById(unit);

  useEffect(() => {
    if (popoverRef.current) {
      setPopoverWidth(popoverRef.current.offsetWidth);
    }
  }, []);

  const handleChangeUnit = useCallback(
    (item: string | undefined) => {
      onUnitChange(item);
    },
    [onUnitChange]
  );

  const inputBoxButton = (
    <EuiFieldText
      id="input"
      placeholder="Select a unit"
      value={selectedUnit?.name ?? ''}
      onClick={() => {
        setPopover(!isPopoverOpen);
      }}
      readOnly={true}
      append={
        unit ? (
          <EuiButtonIcon
            iconType="trash"
            color="subdued"
            data-test-subj="clearUnitButton"
            onClick={() => {
              handleChangeUnit(undefined);
            }}
          />
        ) : (
          <EuiButtonIcon
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
    const all: any[] = [
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
    <StyleAccordion
      id="metricValueOptions"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.units', {
        defaultMessage: 'Units',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow className="full-width-popover">
        <EuiPopover
          button={inputBoxButton}
          isOpen={isPopoverOpen}
          closePopover={() => setPopover(false)}
          panelPaddingSize="none"
          anchorPosition="downLeft"
          hasArrow={false}
          popoverRef={popoverRef}
        >
          <div style={{ width: popoverWidth }}>
            <EuiContextMenu
              data-test-subj="unit_panel_context_menu"
              size="s"
              initialPanelId={lastPanelId}
              panels={panels}
              className="visPanelUnitPopover"
            />
          </div>
        </EuiPopover>
      </EuiFormRow>
    </StyleAccordion>
  );
};
