/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { NumberFormatEditor } from '../number';
import { defaultState } from '../default';

export class BytesFormatEditor extends NumberFormatEditor {
  static formatId = 'bytes';
  state = {
    ...defaultState,
    sampleInputs: [256, 1024, 5150000, 1990000000],
  };
}
