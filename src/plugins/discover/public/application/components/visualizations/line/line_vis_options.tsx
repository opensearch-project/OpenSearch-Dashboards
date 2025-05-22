/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { Option } from '../../style_panel/option';
import { BasicVisOptions } from '../../style_panel/basic_vis_options';
import { LineChartStyleControls } from './line_vis_config';

export interface LineChartStyleControlsProps {
  defaultStyles: LineChartStyleControls;
  onChange: (styles: LineChartStyleControls) => void;
}

export function LineVisStyleControls(props: LineChartStyleControlsProps) {
  return (
    <>
      <Option
        title={i18n.translate('visBuilder.line.params.settingsTitle', {
          defaultMessage: 'Style settings',
        })}
      >
        <BasicVisOptions defaultStyles={props.defaultStyles} onChange={props.onChange} />
      </Option>
    </>
  );
}
