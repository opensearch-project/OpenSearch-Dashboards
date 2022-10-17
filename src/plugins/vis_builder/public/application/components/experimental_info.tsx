/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

export const InfoComponent = () => {
  return (
    <EuiCallOut
      className="hide-for-sharing"
      data-test-subj="experimentalVisInfo"
      size="s"
      title={i18n.translate('wizard.experimentalInfoTitle', {
        defaultMessage: 'This editor is experimental and should not be used in production',
      })}
      iconType="beaker"
    >
      <FormattedMessage
        id="wizard.experimentalInfoText"
        defaultMessage="We want to hear from you about how we can improve your experience. Leave feedback in {githubLink}."
        values={{
          githubLink: (
            <EuiLink
              external
              href="https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2280"
              target="_blank"
            >
              the GitHub issue
            </EuiLink>
          ),
        }}
      />
    </EuiCallOut>
  );
};

export const ExperimentalInfo = memo(InfoComponent);
