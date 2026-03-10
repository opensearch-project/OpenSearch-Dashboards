/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import type { CelestialCardProps } from '../../components/celestial_card';

interface UseCelestialActionsProps {
  onDataFetch?: (node?: CelestialCardProps) => void;
  addBreadcrumb: (title: string, node?: CelestialCardProps) => void;
}

export const useCelestialNodeActions = ({
  onDataFetch,
  addBreadcrumb,
}: UseCelestialActionsProps) => {
  const onGroupToggle = useCallback(
    (event: React.MouseEvent, nodeProps: CelestialCardProps) => {
      event.stopPropagation();
      const groupId = nodeProps.id;
      addBreadcrumb(nodeProps.title || groupId, nodeProps);
      onDataFetch?.(nodeProps);
    },
    [onDataFetch, addBreadcrumb]
  );

  return {
    onGroupToggle,
  };
};
