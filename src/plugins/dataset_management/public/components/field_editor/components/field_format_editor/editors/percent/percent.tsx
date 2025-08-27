/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { NumberFormatEditor } from '../number';
import { defaultState } from '../default';

export class PercentFormatEditor extends NumberFormatEditor {
  static formatId = 'percent';
  state = {
    ...defaultState,
    sampleInputs: [0.1, 0.99999, 1, 100, 1000],
  };
}
