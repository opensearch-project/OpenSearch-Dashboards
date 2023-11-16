/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { RangeOption, SwitchOption } from '../../charts/public';
import { DrilldownVisParams } from './types';

function SettingsOptions({ stateParams, setValue }: VisOptionsProps<DrilldownVisParams>) {
  return (
    <EuiPanel paddingSize="s">
      <RangeOption
        label={i18n.translate('visTypeMarkdown.params.fontSizeLabel', {
          defaultMessage: 'Base font size in points',
        })}
        max={36}
        min={8}
        paramName="fontSize"
        showInput
        value={stateParams.fontSize}
        setValue={setValue}
      />

      <SwitchOption
        label={i18n.translate('visTypeMarkdown.params.openLinksLabel', {
          defaultMessage: 'Open links in new tab',
        })}
        paramName="openLinksInNewTab"
        value={stateParams.openLinksInNewTab}
        setValue={setValue}
      />
    </EuiPanel>
  );
}

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { SettingsOptions as default };
