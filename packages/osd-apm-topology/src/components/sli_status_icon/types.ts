/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SliStatus } from '../../shared/types/common.types';

export interface SliStatusIconProps {
  size: number;
  isPulsing?: boolean;
  status: SliStatus;
}
