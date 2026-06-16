/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLocation } from 'react-router-dom';

export const useCurrentExploreId = (operation: 'edit' | 'view' = 'view') => {
  const location = useLocation();
  const hash = location.hash;

  const match = hash.match(new RegExp(`^#\\/${operation}\\/([^\\/\\?]+)`));
  const id = match ? match[1] : undefined;
  return id;
};
