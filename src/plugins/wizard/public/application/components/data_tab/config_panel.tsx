/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm, EuiTitle } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { ConfigSection } from './config_section';

import './config_panel.scss';
import { useTypedSelector } from '../../utils/state_management';

export function ConfigPanel() {
  const { configSections } = useTypedSelector((state) => state.config);

  return (
    <EuiForm className="wizConfigPanel">
      <EuiTitle size="xxxs">
        <h2 className="wizConfigPanel__title">
          {i18n.translate('wizard.nav.dataTab.configPanel.title', {
            defaultMessage: 'Configuration',
          })}
        </h2>
      </EuiTitle>
      {Object.entries(configSections).map(([sectionId, sectionProps], index) => (
        <ConfigSection key={index} id={sectionId} {...sectionProps} />
      ))}
    </EuiForm>
  );
}
