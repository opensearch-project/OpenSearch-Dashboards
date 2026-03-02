/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon, IconSize } from '@elastic/eui';
import { ChromeBranding } from '../../chrome_service';
import type { Logos } from '../../../../common/types';

interface Props {
  branding: ChromeBranding;
  logos: Logos;
}

/**
 * Use branding configurations to render the header mark on the nav bar.
 */
export const HomeIcon = ({ branding, logos }: Props) => {
  // Removed prop unnecessary useExpandedHeader Wazuh dashboard
  const { applicationTitle = 'Wazuh dashboard', useExpandedHeader } = branding;

  const { url: markURL, type: markType } = logos.Mark;

  let testSubj = `${markType}Mark`;
  // Marks look better at the large size
  let markIconSize: IconSize = 'l';

  // If no custom branded mark was set, use `home` icon Wazuh dashboard
  if (markType !== 'custom' && useExpandedHeader) {
    testSubj = 'homeIcon';
    // Home icon should be medium to fit in with other icons
    markIconSize = 'm';
  }

  const alt = `${applicationTitle} home`;

  return (
    <EuiIcon
      data-test-subj={testSubj}
      data-test-image-url={markURL}
      type={markURL}
      title={alt}
      size={markIconSize}
      className="logoImage"
    />
  );
};
