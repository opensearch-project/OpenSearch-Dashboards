/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ClassicExperienceBanner } from '../classic_experience_banner';
import { NewExperienceBanner } from '../new_experience_banner';

export const ExperienceBannerWrapper = ({
  initializeBannerWrapper,
}: {
  initializeBannerWrapper: () => Promise<{
    showClassicExperienceBanner: boolean;
    navigateToExplore: () => void;
  }>;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [handleSwitchToExplore, setHandleSwitchToExplore] = useState<(() => void) | null>(null);
  const [showClassic, setShowClassic] = useState<boolean>(false);

  useEffect(() => {
    const callInitializeBannerWrapper = async () => {
      const { showClassicExperienceBanner, navigateToExplore } = await initializeBannerWrapper();
      setHandleSwitchToExplore(() => navigateToExplore);
      setShowClassic(showClassicExperienceBanner);
      setIsMounted(true);
    };

    callInitializeBannerWrapper();
  }, [initializeBannerWrapper]);

  if (!isMounted) {
    return null;
  }

  // there is no reason for !!handleSwitchToExplore to be false here, but in case it is, then
  // we will not show the banner
  return !!handleSwitchToExplore && showClassic ? (
    <ClassicExperienceBanner navigateToExplore={handleSwitchToExplore} />
  ) : (
    <NewExperienceBanner />
  );
};
