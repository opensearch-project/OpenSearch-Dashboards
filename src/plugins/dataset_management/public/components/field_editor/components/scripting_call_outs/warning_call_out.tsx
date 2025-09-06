/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import { EuiCallOut, EuiIcon, EuiLink, EuiSpacer } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';

export interface ScriptingWarningCallOutProps {
  isVisible: boolean;
}

export const ScriptingWarningCallOut = ({ isVisible = false }: ScriptingWarningCallOutProps) => {
  const docLinksScriptedFields = useOpenSearchDashboards<DatasetManagmentContext>().services
    .docLinks?.links.noDocumentation.scriptedFields;
  return isVisible ? (
    <Fragment>
      <EuiCallOut
        title={
          <FormattedMessage
            id="datasetManagement.warningCallOutHeader"
            defaultMessage="Proceed with caution"
          />
        }
        color="warning"
        iconType="alert"
      >
        <p>
          <FormattedMessage
            id="datasetManagement.warningCallOutLabel.callOutDetail"
            defaultMessage="Please familiarize yourself with {scripFields} and with {scriptsInAggregation} before using scripted fields."
            values={{
              scripFields: (
                <EuiLink target="_blank" href={docLinksScriptedFields.scriptFields}>
                  <FormattedMessage
                    id="datasetManagement.warningCallOutLabel.scripFieldsLink"
                    defaultMessage="script fields"
                  />
                  &nbsp;
                  <EuiIcon type="link" />
                </EuiLink>
              ),
              scriptsInAggregation: (
                <EuiLink target="_blank" href={docLinksScriptedFields.scriptAggs}>
                  <FormattedMessage
                    id="datasetManagement.warningCallOutLabel.scriptsInAggregationLink"
                    defaultMessage="scripts in aggregations"
                  />
                  &nbsp;
                  <EuiIcon type="link" />
                </EuiLink>
              ),
            }}
          />
        </p>
        <p>
          <FormattedMessage
            id="datasetManagement.warningCallOut.descriptionLabel"
            defaultMessage="Scripted fields can be used to display and aggregate calculated values. As such, they can be very slow, and
            if done incorrectly, can cause OpenSearch Dashboards to be unusable. There's no safety net here. If you make a typo, unexpected exceptions
            will be thrown all over the place!"
          />
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </Fragment>
  ) : null;
};

ScriptingWarningCallOut.displayName = 'ScriptingWarningCallOut';
