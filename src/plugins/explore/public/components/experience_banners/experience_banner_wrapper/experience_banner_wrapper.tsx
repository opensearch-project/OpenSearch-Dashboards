/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ClassicExperienceBanner } from '../classic_experience_banner';

export const ExperienceBannerWrapper = ({
  initializeBannerWrapper,
}: {
  initializeBannerWrapper: () => Promise<{
    showClassicExperienceBanner: boolean;
    navigateToExplore: () => void;
  }>;
}) => {
  const [state, setState] = useState<{
    showBanner: boolean;
    handleSwitchToExplore: () => void;
  } | null>(null);

  useEffect(() => {
    const callInitializeBannerWrapper = async () => {
      const { showClassicExperienceBanner, navigateToExplore } = await initializeBannerWrapper();
      setState({
        showBanner: showClassicExperienceBanner,
        handleSwitchToExplore: navigateToExplore,
      });
    };

    callInitializeBannerWrapper();
  }, [initializeBannerWrapper]);

  if (!state || !state.showBanner) {
    return null;
  }

  return <ClassicExperienceBanner navigateToExplore={state.handleSwitchToExplore} />;
};
