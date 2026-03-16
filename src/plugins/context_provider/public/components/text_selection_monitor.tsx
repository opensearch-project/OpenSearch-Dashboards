/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useTextSelection } from '../hooks/use_text_selection';

/**
 * Global component that monitors text selection across the application
 * Part of the OSD Assistant framework
 */
export const TextSelectionMonitor: React.FC = () => {
  // Simply use the hook to enable text selection monitoring
  useTextSelection();

  // This component doesn't render anything
  return null;
};
