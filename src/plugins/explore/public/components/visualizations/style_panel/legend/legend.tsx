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
  title2?: string;
}

export interface LegendOptionsProps {
  legendOptions: LegendOptions;
  onLegendOptionsChange: (legendOptions: Partial<LegendOptions>) => void;
  hasTwoLegends?: boolean;
}

export const LegendOptionsPanel = ({
  legendOptions,
  onLegendOptionsChange,
  hasTwoLegends = false,
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
              hasTwoLegends
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
                hasTwoLegends
                  ? i18n.translate('explore.stylePanel.legend.colorTitle.placeholder', {
                      defaultMessage: 'Color legend name',
                    })
                  : i18n.translate('explore.stylePanel.legend.title.placeholder', {
                      defaultMessage: 'Legend name',
                    })
              }
            />
          </EuiFormRow>
          {hasTwoLegends && (
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.legend.title2', {
                defaultMessage: 'Size legend title',
              })}
            >
              <DebouncedFieldText
                value={legendOptions.title2 || ''}
                onChange={(value: string) => onLegendOptionsChange({ title2: value })}
                data-test-subj="legendTitle2Input"
                placeholder={i18n.translate('explore.stylePanel.legend.title2.placeholder', {
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
