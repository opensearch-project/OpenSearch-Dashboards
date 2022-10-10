/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { ExperimentalCallout } from './experimental_callout';

const titleIdentifier = '.euiCallOutHeader__title';
const descriptionIdentifier = '[data-test-subj="index-pattern-experimental-callout-text"]';
const expectedTitleText = 'Experimental feature active';
const expectedDescriptionText =
  'The experimental feature Data Source Connection is active. To create an index pattern without using data from an external source, use default. Any index pattern created using an external data source will result in an error if the experimental feature is deactivated.';

describe('Index pattern experimental callout component', () => {
  test('should render normally', () => {
    const component = mount(<ExperimentalCallout />);
    const titleText = component.find(titleIdentifier).text();
    const descriptionText = component.find(descriptionIdentifier).last().text();

    expect(titleText).toBe(expectedTitleText);
    expect(descriptionText).toBe(expectedDescriptionText);
    expect(component).toMatchSnapshot();
  });
});
