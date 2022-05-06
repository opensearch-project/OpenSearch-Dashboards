/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import VectorUploadOptions from './vector_upload_options';

describe('vector_upload_options', () => {
  it('renders the VectorUploadOptions based on props provided', () => {
    const props = {
      vis: {
        http: '',
        notifications: '',
      },
    };
    const wrapper = shallow(<VectorUploadOptions {...props} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
