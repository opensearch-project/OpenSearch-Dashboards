/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';

export const ExperimentalCallout = () => {
  return (
    <>
      <EuiCallOut
        title={i18n.translate('indexPatternManagement.experimentalFeatureCallout.title', {
          defaultMessage: 'Experimental Feature',
        })}
        iconType="alert"
        color="warning"
        data-test-subj="index-pattern-experimental-callout"
      >
        <EuiText data-test-subj="index-pattern-experimental-callout-text">
          <p>
            <FormattedMessage
              id="indexPatternManagement.experimentalFeatureCallout.description"
              defaultMessage="The experimental feature {dataSourceConnection} is active. "
              values={{
                dataSourceConnection: (
                  <b>
                    <FormattedMessage
                      id="indexPatternManagement.experimentalFeatureCallout.dataSourceConnection"
                      defaultMessage="Data Source Connection"
                    />
                  </b>
                ),
              }}
            />
            <FormattedMessage
              id="indexPatternManagement.experimentalFeatureCallout.instruction"
              defaultMessage="To create an index pattern without using data from an external source, use {default}. "
              values={{
                default: (
                  <b>
                    <FormattedMessage
                      id="indexPatternManagement.experimentalFeatureCallout.default"
                      defaultMessage="default"
                    />
                  </b>
                ),
              }}
            />
            <FormattedMessage
              id="indexPatternManagement.experimentalFeatureCallout.instruction"
              defaultMessage="Any index pattern created using an external data source will result in an error if the experimental feature is deactivated."
            />
          </p>
        </EuiText>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};
