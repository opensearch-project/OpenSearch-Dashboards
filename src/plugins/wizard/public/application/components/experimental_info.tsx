/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export const InfoComponent = () => {
  const title = (
    <>
      <FormattedMessage
        id="wizard.experimentalInfoText"
        defaultMessage="This editor is experimental, do not use in production.
          For feedback, please create an issue in {githubLink}."
        values={{
          githubLink: (
            <EuiLink
              external
              href="https://github.com/opensearch-project/OpenSearch-Dashboards/issues/new/choose"
              target="_blank"
            >
              GitHub
            </EuiLink>
          ),
        }}
      />
    </>
  );

  return (
    <EuiCallOut
      className="hide-for-sharing"
      data-test-subj="experimentalVisInfo"
      size="s"
      title={title}
      iconType="beaker"
    />
  );
};

export const ExperimentalInfo = memo(InfoComponent);
