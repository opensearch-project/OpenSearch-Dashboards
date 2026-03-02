/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HTMLAttributes } from 'react';

export interface DescriptionProps extends HTMLAttributes<HTMLElement> {
  label: string;
  value: string;
}
