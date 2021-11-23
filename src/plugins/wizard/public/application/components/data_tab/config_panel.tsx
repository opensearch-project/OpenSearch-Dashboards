/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm, EuiTitle } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { BUCKET_TYPES, METRIC_TYPES } from '../../../../../data/public';
import { ConfigSection } from './config_section';

import './config_panel.scss';

// TODO: Temp. Remove once visualizations can be refgistered and editor configs can be passed along
const CONFIG = {
  x: {
    title: 'X Axis',
    allowedAggregation: BUCKET_TYPES.TERMS,
  },
  y: {
    title: 'Y Axis',
    allowedAggregation: METRIC_TYPES.AVG,
  },
};

export function ConfigPanel() {
  const sections = CONFIG;

  return (
    <EuiForm className="wizConfigPanel">
      <EuiTitle size="xxxs">
        <h2 className="wizConfigPanel__title">
          {i18n.translate('wizard.nav.dataTab.configPanel.title', {
            defaultMessage: 'Configuration',
          })}
        </h2>
      </EuiTitle>
      {Object.entries(sections).map(([sectionId, sectionProps], index) => (
        <ConfigSection key={index} id={sectionId} {...sectionProps} onChange={() => {}} />
      ))}
    </EuiForm>
  );
}
