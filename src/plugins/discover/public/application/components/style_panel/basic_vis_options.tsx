/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { SelectOption, SwitchOption } from '../../../../../charts/public';
import { getConfigCollections } from '../../../../../vis_type_vislib/public';

export const BasicVisOptions = (defaultStyle: any, onChange) => {
  const [styles, setStyles] = useState(defaultStyle);
  console.log('styles', styles);
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
        value={styles.defaultStyle.legendPosition}
        setValue={(_, value) => console.log('value', value)}
      />
      <SwitchOption
        label={i18n.translate('visBuilder.controls.vislibBasicOptions.showTooltipLabel', {
          defaultMessage: 'Show tooltip',
        })}
        paramName="addTooltip"
        value={styles.defaultStyle.addTooltip}
        setValue={(_, value) => console.log('value', value)}
      />
    </>
  );
};
