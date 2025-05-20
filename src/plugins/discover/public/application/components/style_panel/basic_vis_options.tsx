/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { SelectOption, SwitchOption } from '../../../../../charts/public';
import { getConfigCollections } from '../../../../../vis_type_vislib/public';
import { LineChartStyleControls } from '../visualizations/line/line_vis_type';
import { LineChartStyleControlsProps } from '../visualizations/line/line_vis_options';

export const BasicVisOptions = ({ defaultStyles, onChange }: LineChartStyleControlsProps) => {
  const [styles, setStyles] = useState<LineChartStyleControls>(defaultStyles);
  const updateStyle = (key: any, value: any) => {
    const newStyles = { ...styles, [key]: value };
    setStyles(newStyles);
    onChange(newStyles);
  };
  const { legendPositions } = getConfigCollections();
  return (
    <>
      <SelectOption
        label={i18n.translate('visBuilder.controls.vislibBasicOptions.legendPositionLabel', {
          defaultMessage: 'Legend position',
        })}
        options={legendPositions}
        paramName="legendPosition"
        value={styles.legendPosition}
        setValue={(_, value) => updateStyle('legendPosition', value)}
      />
      <SwitchOption
        label={i18n.translate('visBuilder.controls.vislibBasicOptions.showTooltipLabel', {
          defaultMessage: 'Show tooltip',
        })}
        paramName="addTooltip"
        value={styles.addTooltip}
        setValue={(_, value) => updateStyle('addTooltip', value)}
      />
    </>
  );
};
