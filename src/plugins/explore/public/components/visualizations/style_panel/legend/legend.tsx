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
  titleForSize?: string;
}

export interface LegendOptionsProps {
  legendOptions: LegendOptions;
  onLegendOptionsChange: (legendOptions: Partial<LegendOptions>) => void;
  hasSizeLegend?: boolean;
}

export const LegendOptionsPanel = ({
  legendOptions,
  onLegendOptionsChange,
  hasSizeLegend = false,
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
        checked={legendOptions.show}
        onChange={(e) => onLegendOptionsChange({ show: e.target.checked })}
        data-test-subj="legendModeSwitch"
      />

      {legendOptions.show && (
        <>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.legend.position', {
              defaultMessage: 'Position',
            })}
          >
            <EuiSelect
              compressed
              options={legendPositionOptions}
              value={legendOptions.position}
              onChange={(e) => onLegendOptionsChange({ position: e.target.value as Positions })}
              onMouseUp={(e) => e.stopPropagation()}
              data-test-subj="legendPositionSelect"
            />
          </EuiFormRow>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={
              hasSizeLegend
                ? i18n.translate('explore.stylePanel.legend.colorTitle', {
                    defaultMessage: 'Color legend title',
                  })
                : i18n.translate('explore.stylePanel.legend.title', {
                    defaultMessage: 'Legend title',
                  })
            }
          >
            <DebouncedFieldText
              value={legendOptions.title || ''}
              onChange={(value: string) => onLegendOptionsChange({ title: value })}
              data-test-subj="legendTitleInput"
              placeholder={
                hasSizeLegend
                  ? i18n.translate('explore.stylePanel.legend.colorTitle.placeholder', {
                      defaultMessage: 'Color legend name',
                    })
                  : i18n.translate('explore.stylePanel.legend.title.placeholder', {
                      defaultMessage: 'Legend name',
                    })
              }
            />
          </EuiFormRow>
          {hasSizeLegend && (
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.legend.titleForSize', {
                defaultMessage: 'Size legend title',
              })}
            >
              <DebouncedFieldText
                value={legendOptions.titleForSize || ''}
                onChange={(value: string) => onLegendOptionsChange({ titleForSize: value })}
                data-test-subj="legendTitleForSizeInput"
                placeholder={i18n.translate('explore.stylePanel.legend.titleForSize.placeholder', {
                  defaultMessage: 'Size legend name',
                })}
              />
            </EuiFormRow>
          )}
        </>
      )}
    </StyleAccordion>
  );
};
