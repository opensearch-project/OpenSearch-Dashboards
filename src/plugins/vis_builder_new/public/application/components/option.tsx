/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiAccordion, EuiHorizontalRule, EuiPanel, EuiSpacer } from '@elastic/eui';
import React, { FC } from 'react';
import './option.scss';

interface Props {
  title: string;
  initialIsOpen?: boolean;
}

export const Option: FC<Props> = ({ title, children, initialIsOpen = false }) => {
  return (
    <>
      <EuiAccordion
        id={title}
        buttonContent={title}
        className="vbOption"
        initialIsOpen={initialIsOpen}
        data-test-subj={`vbOption-${title.replace(/\s+/g, '-')}`}
      >
        <EuiSpacer size="s" />
        <EuiPanel color="subdued" className="vbOption__panel">
          {children}
        </EuiPanel>
      </EuiAccordion>
      <EuiHorizontalRule margin="none" />
    </>
  );
};
