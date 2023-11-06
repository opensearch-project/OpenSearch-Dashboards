/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageTemplate, EuiSpacer } from '@elastic/eui';
import { GetStartedSection } from './hero_section';
import { BasicsSection, DataSection } from './section';

export const Homepage: React.FC = () => {
  return (
    <EuiPageTemplate
      restrictWidth={1600}
      pageContentProps={{
        color: 'transparent',
      }}
    >
      <GetStartedSection />
      <EuiSpacer />
      <DataSection />
      <EuiSpacer />
      <BasicsSection />
    </EuiPageTemplate>
  );
};
