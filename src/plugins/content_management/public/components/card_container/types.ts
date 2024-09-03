/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCardProps } from '@elastic/eui';
import { ContainerInput } from '../../../../embeddable/public';

export interface CardExplicitInput {
  title?: string;
  description: string;
  toolTipContent?: string;
  getTitle?: () => React.ReactElement;
  onClick?: () => void;
  getIcon?: () => React.ReactElement;
  getFooter?: () => React.ReactElement;
  cardProps?: Omit<EuiCardProps, 'title' | 'description'>;
}

export type CardContainerInput = ContainerInput<CardExplicitInput> & {
  columns?: number;
  wrap?: boolean;
  grid?: boolean;
};

/**
 * The props which allow to be updated after card container was created
 */
export type CardContainerExplicitInput = Partial<Pick<CardContainerInput, 'title' | 'columns'>>;
