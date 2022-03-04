/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSuperSelectProps } from '@elastic/eui';
import { WizardServices } from 'src/plugins/wizard/public';
import { RootState } from '../../../../utils/state_management';

/**
 * Types for contributions shared across various panels
 */
export enum ITEM_TYPES {
  SELECT = 'select',
  INPUT = 'input',
}

export const ItemTypes = {
  ...ITEM_TYPES,
};

export interface InitProps {
  state: {
    root: RootState;
    parent: any;
  };
  services: WizardServices;
  intialValue: any;
}

export interface SelectContribution {
  type: ITEM_TYPES.SELECT;
  id: string;
  label: string;
  options:
    | EuiSuperSelectProps<string>['options']
    | ((state: RootState, services: WizardServices) => EuiSuperSelectProps<string>['options']);
  onChange?: (option: string) => void;
  init: (props: InitProps) => any;
  'data-test-subj'?: string;
  idAria?: string;
}

export interface InputContribution {
  type: ITEM_TYPES.INPUT;
  id: string;
  label: string;
  onChange?: (value: string) => void;
  init: (props: InitProps) => any;
  'data-test-subj'?: string;
  idAria?: string;
}

export type CommonItemContribution = SelectContribution | InputContribution;
