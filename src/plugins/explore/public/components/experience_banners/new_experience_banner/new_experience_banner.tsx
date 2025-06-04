/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import './new_experience_banner.scss';
import { NEW_DISCOVER_INFO_URL, SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY } from '../constants';

export const NewExperienceBanner = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // TODO: This should open a modal to add more friction
  const handleSwitch = () => {
    localStorage.setItem(SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY, 'true');
    window.location.reload();
  };

  return isVisible ? (
    <EuiCallOut
      className="exploreNewExperienceBanner"
      data-test-subj="exploreNewExperienceBanner"
      size="s"
      dismissible={true}
      onDismiss={() => setIsVisible(false)}
    >
      <span
        className="exploreNewExperienceBanner__img"
        role="img"
        aria-label="New discover celebration"
      >
        🎉
      </span>
      Learn about the{' '}
      <EuiLink
        href={NEW_DISCOVER_INFO_URL}
        target="_blank"
        data-test-subj="exploreNewExperienceBanner__learnMore"
      >
        new discover experience
      </EuiLink>
      , or{' '}
      <EuiLink onClick={handleSwitch} data-test-subj="exploreNewExperienceBanner__switch">
        switch back to classic discover
      </EuiLink>
      .
    </EuiCallOut>
  ) : null;
};
