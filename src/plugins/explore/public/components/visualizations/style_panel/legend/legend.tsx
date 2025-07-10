/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFormRow, EuiButtonGroup, EuiSpacer } from '@elastic/eui';
import { Positions } from '../../types';
import { StyleAccordion } from '../style_accordion';

export interface LegendOptions {
  show: boolean;
  position: Positions;
}

export interface LegendOptionsProps {
  legendOptions: LegendOptions;
  onLegendOptionsChange: (legendOptions: Partial<LegendOptions>) => void;
  shouldShowLegend?: boolean;
}

export const LegendOptionsPanel = ({
  legendOptions,
  onLegendOptionsChange,
  shouldShowLegend = true,
}: LegendOptionsProps) => {
  if (!shouldShowLegend || !legendOptions || !onLegendOptionsChange) {
    return null;
  }

  const legendModeOptions = [
    {
      id: 'true',
      label: i18n.translate('explore.stylePanel.legend.mode.shown', {
        defaultMessage: 'Shown',
      }),
    },
    {
      id: 'false',
      label: i18n.translate('explore.stylePanel.legend.mode.hidden', {
        defaultMessage: 'Hidden',
      }),
    },
  ];

  const legendPositionOptions = [
    {
      id: Positions.RIGHT,
      label: i18n.translate('explore.stylePanel.legend.position.right', {
        defaultMessage: 'Right',
      }),
    },
    {
      id: Positions.BOTTOM,
      label: i18n.translate('explore.stylePanel.legend.position.bottom', {
        defaultMessage: 'Bottom',
      }),
    },
    {
      id: Positions.LEFT,
      label: i18n.translate('explore.stylePanel.legend.position.left', {
        defaultMessage: 'Left',
      }),
    },
    {
      id: Positions.TOP,
      label: i18n.translate('explore.stylePanel.legend.position.top', {
        defaultMessage: 'Top',
      }),
    },
  ];

  return (
    <StyleAccordion
      id="legendSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.legend', {
        defaultMessage: 'Legend',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.legend.mode', {
          defaultMessage: 'Legend mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.legend.mode', {
            defaultMessage: 'Legend mode',
          })}
          options={legendModeOptions}
          idSelected={legendOptions.show.toString()}
          onChange={(id) => onLegendOptionsChange({ show: id === 'true' })}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="legendModeButtonGroup"
        />
      </EuiFormRow>

      {legendOptions.show && (
        <>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.legend.position', {
              defaultMessage: 'Legend position',
            })}
          >
            <EuiButtonGroup
              legend={i18n.translate('explore.stylePanel.legend.position', {
                defaultMessage: 'Legend position',
              })}
              options={legendPositionOptions}
              idSelected={legendOptions.position}
              onChange={(id) => onLegendOptionsChange({ position: id as Positions })}
              buttonSize="compressed"
              isFullWidth
              data-test-subj="legendPositionButtonGroup"
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
