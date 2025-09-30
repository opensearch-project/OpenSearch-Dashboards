/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import { EuiCallOut, EuiSpacer } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

export const ScriptingDisabledCallOut = ({ isVisible = false }) => {
  return isVisible ? (
    <Fragment>
      <EuiCallOut
        title={
          <FormattedMessage
            id="datasetManagement.disabledCallOutHeader"
            defaultMessage="Scripting disabled"
            description="Showing the status that scripting is disabled in OpenSearch. Not an update message, that it JUST got disabled."
          />
        }
        color="danger"
        iconType="alert"
      >
        <p>
          <FormattedMessage
            id="datasetManagement.disabledCallOutLabel"
            defaultMessage="All inline scripting has been disabled in OpenSearch. You must enable inline scripting for at least one
            language in order to use scripted fields in OpenSearch Dashboards."
          />
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </Fragment>
  ) : null;
};

ScriptingDisabledCallOut.displayName = 'ScriptingDisabledCallOut';
