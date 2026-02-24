/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { t } from '../../shared/i18n/t';
import type { TId } from '../../shared/i18n/t';
import type { CelestialCardProps } from '../CelestialCard/types';
import type { Breadcrumb } from './types';
import { useFitViewWithDelay } from '../../shared/hooks/use-fit-view-with-delay.hook';

/**
 * Custom hook for managing breadcrumb navigation in a flow diagram
 */
export const useBreadcrumbs = () => {
  // Hook for handling view fitting with delay
  const fitViewWithDelay = useFitViewWithDelay();

  // Initialize breadcrumbs array with root view
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    {
      title: t('breadcrumbs.world' as TId),
    },
  ]);

  /**
   * Adds a new breadcrumb to the navigation history
   * @param {string} title - Display title for the breadcrumb
   * @param {CelestialCardProps} node - Optional node data associated with the breadcrumb
   */
  const addBreadcrumb = (title: string, node?: CelestialCardProps) => {
    const newBreadcrumb: Breadcrumb = {
      title,
      node,
    };
    setBreadcrumbs((prev) => {
      if (prev.some((breadcrumb) => !!node?.id && breadcrumb.node?.id === node?.id)) {
        return prev;
      }

      return [...prev, newBreadcrumb];
    });
    fitViewWithDelay();
  };

  /**
   * Navigates to a specific breadcrumb in the history by truncating subsequent items
   * @param {number} index - Index of the target breadcrumb to navigate to
   */
  const navigateToBreadcrumb = useCallback(
    (index: number) => {
      // Truncate breadcrumbs array to include only items up to target index
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      fitViewWithDelay();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breadcrumbs, fitViewWithDelay]
  );

  return {
    breadcrumbs,
    addBreadcrumb,
    navigateToBreadcrumb,
  };
};
