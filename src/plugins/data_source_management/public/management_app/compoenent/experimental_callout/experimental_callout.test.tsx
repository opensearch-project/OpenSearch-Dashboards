/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { ExperimentalCallout } from './experimental_callout';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { docLinks } from '../../../mocks';

describe('Dataasource experimental callout component', () => {
  test('should render normally', () => {
    const mockedDocLinks = docLinks as DocLinksStart;
    const component = shallow(<ExperimentalCallout docLinks={mockedDocLinks} />);
    expect(component).toMatchSnapshot();
  });
});
