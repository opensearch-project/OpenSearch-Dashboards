/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect } from '@elastic/eui';
import React from 'react';
import { ColorModeOption } from '../../types';

export const ColorModeOptionSelect = ({
  colorModeOption,
  onColorModeOptionChange,
  disableThreshold = false,
  disableValueMapping = false,
}: {
  colorModeOption: ColorModeOption | undefined;
  onColorModeOptionChange?: (option: ColorModeOption | undefined) => void;
  disableThreshold?: boolean;
  disableValueMapping?: boolean;
}) => {
  return (
    <EuiFormRow
      label={i18n.translate('explore.vis.valueMapping.colorModeOption', {
        defaultMessage: 'Color mode options',
      })}
    >
      <EuiSelect
        compressed
        data-test-subj="colorModeOptionsSelection"
        value={colorModeOption ? colorModeOption : 'none'}
        onChange={(e) => onColorModeOptionChange?.(e.target.value as ColorModeOption)}
        onMouseUp={(e) => e.stopPropagation()}
        options={[
          ...(disableValueMapping
            ? []
            : [
                {
                  value: 'useValueMapping',
                  text: i18n.translate('explore.vis.valueMapping.useValueMapping', {
                    defaultMessage: 'Use value mappings',
                  }),
                },
                {
                  value: 'highlightValueMapping',
                  text: i18n.translate('explore.vis.valueMapping.highlightValueMapping', {
                    defaultMessage: 'Highlight value mappings',
                  }),
                },
              ]),
          {
            value: 'none',
            text: i18n.translate('explore.vis.valueMapping.none', {
              defaultMessage: 'None',
            }),
          },
          ...(!disableThreshold
            ? [
                {
                  value: 'useThresholdColor',
                  text: i18n.translate('explore.vis.valueMapping.useThresholdColor', {
                    defaultMessage: 'Use Threshold Color',
                  }),
                },
              ]
            : []),
        ]}
      />
    </EuiFormRow>
  );
};
