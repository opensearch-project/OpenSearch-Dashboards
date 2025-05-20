/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { Option } from '../../style_panel/option';
import { BasicVisOptions } from '../../style_panel/basic_vis_options';

function LineVisOptions(defaultStyle: any) {
  return (
    <>
      <Option
        title={i18n.translate('visBuilder.line.params.settingsTitle', {
          defaultMessage: 'Style settings',
        })}
      >
        <BasicVisOptions defaultStyle={defaultStyle} />
      </Option>
    </>
  );
}

export { LineVisOptions };
