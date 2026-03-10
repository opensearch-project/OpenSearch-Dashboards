/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

export interface StackWrapperProps {
  children: ReactNode;
  hiddenChildrenCount: number;
  stackSpacing?: number;
  maxVisibleStacks?: number;
  button?: ReactNode;
  isFaded: boolean;
}
