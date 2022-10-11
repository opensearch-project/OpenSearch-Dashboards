/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { ExperimentalCallout } from './experimental_callout';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { docLinks } from '../../../mocks';

const titleIdentifier = '.euiCallOutHeader__title';
const descriptionIdentifier = '[data-test-subj="data-source-experimental-call"]';
const expectedTitleText = 'Experimental Feature';
const expectedDescriptionText =
  'Experimental FeatureThe feature is experimental and should not be used in a production environment. Any index patterns, visualization, and observability panels will be impacted if the feature is deactivated. For more information see Data Source Documentation(opens in a new tab or window) To leave feedback, visit OpenSearch Forum';

describe('Datasource experimental callout component', () => {
  test('should render normally', () => {
    const mockedDocLinks = docLinks as DocLinksStart;
    const component = mount(<ExperimentalCallout docLinks={mockedDocLinks} />);
    const titleText = component.find(titleIdentifier).text();
    const descriptionText = component.find(descriptionIdentifier).last().text();

    expect(titleText).toBe(expectedTitleText);
    expect(descriptionText).toBe(expectedDescriptionText);
    expect(component).toMatchSnapshot();
  });
});
