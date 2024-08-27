/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { IUiSetup, IUiStart } from './types';

function createSetupContract(): jest.Mocked<IUiSetup> {
  return {
    __enhance: jest.fn(),
  };
}

function createStartContract(): jest.Mocked<IUiStart> {
  return {
    IndexPatternSelect: jest.fn(),
    SearchBar: jest.fn(),
    SuggestionsComponent: jest.fn(), // Add the missing property
    dataSetContainer$: new Observable(),
  };
}

export const uiServiceMock = {
  createSetupContract,
  createStartContract,
};
