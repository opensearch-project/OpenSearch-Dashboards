/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface CallOutsProps {
  deprecatedLangsInUse: string[];
  painlessDocLink: string;
}

export const CallOuts = ({ deprecatedLangsInUse, painlessDocLink }: CallOutsProps) => {
  if (!deprecatedLangsInUse.length) {
    return null;
  }

  return (
    <>
      <EuiCallOut
        title={
          <FormattedMessage
            id="datasetManagement.editDataset.scripted.deprecationLangHeader"
            defaultMessage="Deprecation languages in use"
          />
        }
        color="danger"
        iconType="cross"
      >
        <p>
          <FormattedMessage
            id="datasetManagement.editDataset.scripted.deprecationLangLabel.deprecationLangDetail"
            defaultMessage="The following deprecated languages are in use: {deprecatedLangsInUse}. Support for these languages will be
            removed in the next major version of OpenSearch Dashboards and OpenSearch. Convert you scripted fields to {link} to avoid any problems."
            values={{
              deprecatedLangsInUse: deprecatedLangsInUse.join(', '),
              link: (
                <EuiLink href={painlessDocLink}>
                  <FormattedMessage
                    id="datasetManagement.editDataset.scripted.deprecationLangLabel.painlessDescription"
                    defaultMessage="Painless"
                  />
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};
