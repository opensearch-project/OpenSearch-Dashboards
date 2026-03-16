/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';

export const useElementHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const onMouseEnter = useCallback((_event: React.MouseEvent) => setIsHovered(true), []);
  const onMouseLeave = useCallback((_event: React.MouseEvent) => setIsHovered(false), []);

  return {
    isHovered,
    onMouseEnter,
    onMouseLeave,
  };
};
