/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContainerInput } from '../../../../embeddable/public';

export interface CardExplicitInput {
  title: string;
  description: string;
  onClick?: () => void;
  getIcon?: () => React.ReactElement;
  getFooter?: () => React.ReactElement;
}

export type CardContainerInput = ContainerInput<CardExplicitInput> & { columns?: number };
