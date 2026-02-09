/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiButtonGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GridOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';

interface GridOptionsProps {
  grid: GridOptions;
  onGridChange: (grid: GridOptions) => void;
}

export const GridOptionsPanel: React.FC<GridOptionsProps> = ({ grid, onGridChange }) => {
  if (!grid || !onGridChange) {
    return null;
  }

  const updateGridOption = <K extends keyof GridOptions>(key: K, value: GridOptions[K]) => {
    // Create a new grid object to ensure the change is detected
    const newGrid = {
      ...grid,
      [key]: value,
    };
    onGridChange(newGrid);
  };

  const visibilityOptions = [
    {
      id: 'shown',
      label: i18n.translate('explore.stylePanel.grid.shown', {
        defaultMessage: 'Shown',
      }),
    },
    {
      id: 'hidden',
      label: i18n.translate('explore.stylePanel.grid.hidden', {
        defaultMessage: 'Hidden',
      }),
    },
  ];

  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="gridSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.grid', {
        defaultMessage: 'Grid',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.vis.gridOptions.xLines', {
          defaultMessage: 'X axes',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.gridOptions.xLines', {
            defaultMessage: 'X axes',
          })}
          options={visibilityOptions}
          idSelected={grid.xLines ? 'shown' : 'hidden'}
          onChange={(id) => updateGridOption('xLines', id === 'shown')}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="categoryLinesButtonGroup"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.gridOptions.yLines', {
          defaultMessage: 'Y axes',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.gridOptions.yLines', {
            defaultMessage: 'Y axes',
          })}
          options={visibilityOptions}
          idSelected={grid.yLines ? 'shown' : 'hidden'}
          onChange={(id) => updateGridOption('yLines', id === 'shown')}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="valueLinesButtonGroup"
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
