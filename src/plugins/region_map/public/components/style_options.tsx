/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { IServiceSettings } from '../../../maps_legacy/public';
import { NumberInputOption, SelectOption } from '../../../charts/public';
import { RegionMapVisParams } from '../../../maps_legacy/public';

export type StyleOptionsProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function StyleOptions(props: StyleOptionsProps) {
  const { stateParams, vis, setValue } = props;
  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs" id="styleSettingTitleId">
        <h2>
          <FormattedMessage
            id="regionMap.visParams.styleSettingsLabel"
            defaultMessage="Style settings"
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />

      <SelectOption
        label={i18n.translate('regionMap.visParams.colorSchemaLabel', {
          defaultMessage: 'Color schema',
        })}
        options={vis.type.editorConfig.collections.colorSchemas}
        paramName="colorSchema"
        value={stateParams.colorSchema}
        setValue={setValue}
        id="colorSchemaId"
      />

      <NumberInputOption
        label={i18n.translate('regionMap.visParams.outlineWeightLabel', {
          defaultMessage: 'Border thickness',
        })}
        min={0}
        paramName="outlineWeight"
        value={stateParams.outlineWeight}
        setValue={setValue}
        id="borderThicknessId"
      />
    </EuiPanel>
  );
}

export { StyleOptions };
