/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HTMLAttributes, PropsWithChildren } from 'react';

export interface LabelProps extends PropsWithChildren<HTMLAttributes<HTMLElement>> {
  text: string;
}
