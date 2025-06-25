/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../../common';

export const getFlavorId = (): ExploreFlavor | null => {
  const url = window.location.href;
  const match = url.match(/explore\/(\w+)\/#/);

  return (match?.[1] as ExploreFlavor) ?? null;
};
