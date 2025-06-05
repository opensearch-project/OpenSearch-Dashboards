/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiAccordion, EuiHorizontalRule, EuiPanel, EuiSpacer } from '@elastic/eui';
import React, { FC } from 'react';

interface Props {
  title: string;
}

export const Option: FC<Props> = ({ title, children }) => {
  return (
    <>
      <EuiAccordion
        id={title}
        buttonContent={title}
        className="dvOption"
        data-test-subj={`explore-dvOption-${title.replace(/\s+/g, '-')}`}
      >
        <EuiSpacer size="s" />
        <EuiPanel color="subdued" className="dvOption__panel">
          {children}
        </EuiPanel>
      </EuiAccordion>
      <EuiHorizontalRule margin="none" />
    </>
  );
};
