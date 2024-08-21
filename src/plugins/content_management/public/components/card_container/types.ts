/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCardSelectProps } from '@elastic/eui/src/components/card/card_select';
import { ContainerInput } from '../../../../embeddable/public';

export interface CardExplicitInput {
  title: string;
  description: string;
  onClick?: () => void;
  getIcon?: () => React.ReactElement;
  getFooter?: () => React.ReactElement;
  selectable?: EuiCardSelectProps;
}

export type CardContainerInput = ContainerInput<CardExplicitInput> & {
  columns?: number;
  wrap?: boolean;
};

/**
 * The props which allow to be updated after card container was created
 */
export type CardContainerExplicitInput = Partial<Pick<CardContainerInput, 'title' | 'columns'>>;
