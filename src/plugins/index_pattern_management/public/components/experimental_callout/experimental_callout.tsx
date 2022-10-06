/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';

export const ExperimentalCallout = () => {
  return (
    <>
      <EuiCallOut title={TITLE} iconType="alert" color="warning">
        <p>
          <EuiText>
            {DESCRIPTION_FIRST_PART}
            <b>{DATASOURCE_CONNECTION}</b>
            {DESCRIPTION_SECOND_PART}
            <b>{DEFAULT}</b>
            {DESCRIPTION_THIRD_PART}
          </EuiText>
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};

const TITLE = i18n.translate('indexPatternManagement.experimentalFeatureCallout.title', {
  defaultMessage: 'Experimental feature active',
});

const DESCRIPTION_FIRST_PART = i18n.translate(
  'indexPatternManagement.experimentalFeatureCallout.descriptionPartOne',
  {
    defaultMessage: 'The experimental feature ',
  }
);
const DATASOURCE_CONNECTION = i18n.translate(
  'indexPatternManagement.experimentalFeatureCallout.datasourceConnection',
  {
    defaultMessage: 'Data Source Connection ',
  }
);
const DESCRIPTION_SECOND_PART = i18n.translate(
  'indexPatternManagement.experimentalFeatureCallout.descriptionPartTwo',
  {
    defaultMessage:
      'is active. To create an index pattern without using data from an external source, use ',
  }
);
const DEFAULT = i18n.translate('indexPatternManagement.experimentalFeatureCallout.default', {
  defaultMessage: 'default',
});
const DESCRIPTION_THIRD_PART = i18n.translate(
  'indexPatternManagement.experimentalFeatureCallout.descriptionPartThree',
  {
    defaultMessage:
      '. Any index pattern created using an external data source will result in an error if the experimental feature is deactivated.',
  }
);
