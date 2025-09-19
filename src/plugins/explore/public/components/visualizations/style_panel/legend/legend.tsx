/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFormRow, EuiSpacer, EuiSwitch, EuiSelect } from '@elastic/eui';
import { Positions } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { DebouncedFieldText } from '../utils';

export interface LegendOptions {
  show: boolean;
  position: Positions;
  title?: string;
  role: string;
}

export interface LegendOptionsProps {
  legendOptions: LegendOptions[];
  onLegendOptionsChange: (index: number, legendOptions: Partial<LegendOptions>) => void;
}

export const LegendOptionsPanel = ({
  legendOptions,
  onLegendOptionsChange,
}: LegendOptionsProps) => {
  if (!legendOptions || !onLegendOptionsChange) {
    return null;
  }

  const legendPositionOptions = [
    {
      value: Positions.RIGHT,
      text: i18n.translate('explore.stylePanel.legend.position.right', {
        defaultMessage: 'Right',
      }),
    },
    {
      value: Positions.BOTTOM,
      text: i18n.translate('explore.stylePanel.legend.position.bottom', {
        defaultMessage: 'Bottom',
      }),
    },
    {
      value: Positions.LEFT,
      text: i18n.translate('explore.stylePanel.legend.position.left', {
        defaultMessage: 'Left',
      }),
    },
    {
      value: Positions.TOP,
      text: i18n.translate('explore.stylePanel.legend.position.top', {
        defaultMessage: 'Top',
      }),
    },
  ];

  const handleShowChange = (checked: boolean) => {
    legendOptions.forEach((_, index) => {
      onLegendOptionsChange(index, { show: checked });
    });
  };

  const handlePositionChange = (position: Positions) => {
    legendOptions.forEach((_, index) => {
      onLegendOptionsChange(index, { position });
    });
  };

  return (
    <StyleAccordion
      id="legendSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.legend', {
        defaultMessage: 'Legend',
      })}
      initialIsOpen={true}
    >
      <EuiSwitch
        compressed
        label={i18n.translate('explore.stylePanel.legend.mode', {
          defaultMessage: 'Show legend',
        })}
        checked={legendOptions[0]?.show}
        onChange={(e) => handleShowChange(e.target.checked)}
        data-test-subj="legendModeSwitch"
      />
      {legendOptions[0]?.show && (
        <>
          <EuiSpacer size="s" />
          {legendOptions.map((legend, index) => (
            <div key={index}>
              <EuiFormRow
                label={
                  legendOptions.length === 1
                    ? i18n.translate('explore.vis.legendTitle.simple', {
                        defaultMessage: 'Title',
                      })
                    : i18n.translate('explore.vis.legendTitle', {
                        defaultMessage: '{role} title',
                        values: { role: legend.role },
                      })
                }
              >
                <DebouncedFieldText
                  value={legend.title ?? ''}
                  placeholder={
                    legendOptions.length === 1
                      ? i18n.translate('explore.vis.legendName.simple', {
                          defaultMessage: 'Legend name',
                        })
                      : i18n.translate('explore.vis.legendName', {
                          defaultMessage: '{role} legend name',
                          values: { role: legend.role },
                        })
                  }
                  onChange={(value) => onLegendOptionsChange(index, { title: value })}
                  data-test-subj={`legendTitleInput-${legend.role}`}
                />
              </EuiFormRow>
            </div>
          ))}
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.legend.position', {
              defaultMessage: 'Position',
            })}
          >
            <EuiSelect
              compressed
              options={legendPositionOptions}
              value={legendOptions[0]?.position}
              onChange={(e) => handlePositionChange(e.target.value as Positions)}
              data-test-subj="legendPositionSelect"
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
