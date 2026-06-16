/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PropsWithChildren } from 'react';

export interface AbsolutePositionProps extends PropsWithChildren {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}
