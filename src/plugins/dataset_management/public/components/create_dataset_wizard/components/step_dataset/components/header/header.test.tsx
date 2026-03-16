/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

describe('Header', () => {
  it('should render normally', () => {
    const component = shallowWithI18nProvider(
      <Header
        isInputInvalid={false}
        errors={[]}
        characterList={'%'}
        query={'k'}
        onQueryChanged={() => {}}
        goToNextStep={() => {}}
        isNextStepDisabled={false}
        onChangeIncludingSystemIndices={() => {}}
        isIncludingSystemIndices={false}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should mark the input as invalid', () => {
    const component = shallowWithI18nProvider(
      <Header
        isInputInvalid={true}
        errors={['Input is invalid']}
        characterList={'%'}
        query={'%'}
        onQueryChanged={() => {}}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        onChangeIncludingSystemIndices={() => {}}
        isIncludingSystemIndices={false}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
