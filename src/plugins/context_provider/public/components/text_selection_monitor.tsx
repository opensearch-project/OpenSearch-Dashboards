/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useEffect } from 'react';
import { useTextSelection } from '../hooks/use_text_selection';

/**
 * Global component that monitors text selection across the application
 * Part of the OSD Assistant framework
 */
export const TextSelectionMonitor: React.FC = () => {
  useEffect(() => {
    console.log('[TEXT_SELECTION] TextSelectionMonitor mounted');

    return () => {
      console.log('[TEXT_SELECTION] TextSelectionMonitor unmounted');
    };
  }, []);

  // Simply use the hook to enable text selection monitoring
  const selection = useTextSelection();
  console.log('[TEXT_SELECTION] Monitor current selection:', selection);

  // This component doesn't render anything
  return null;
};
