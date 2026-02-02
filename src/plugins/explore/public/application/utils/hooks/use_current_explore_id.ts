/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLocation } from 'react-router-dom';

export const useCurrentExploreId = () => {
  const location = useLocation();
  const hash = location.hash;

  const match = hash.match(/^#\/view\/([^\/\?]+)/);
  const id = match ? match[1] : undefined;
  return id;
};
