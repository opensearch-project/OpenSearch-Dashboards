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

export const CommonItemTypes = {
  ...ITEM_TYPES,
};

export interface SelectContribution<T extends string> {
  type: ITEM_TYPES.SELECT;
  id: string;
  label: string;
  options:
    | EuiSuperSelectProps<T>['options']
    | ((state: RootState, services: WizardServices) => EuiSuperSelectProps<T>['options']);
  onChange?: (option: string) => void;
  'data-test-subj'?: string;
  idAria?: string;
}

export interface InputContribution {
  type: ITEM_TYPES.INPUT;
  id: string;
  label: string;
  onChange?: (value: string) => void;
  'data-test-subj'?: string;
  idAria?: string;
}

export type CommonItemContribution = SelectContribution<string> | InputContribution;
