/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import { ConnectionTypeIcon } from './connection_type_icon';

describe('ConnectionTypeIcon', () => {
  it('should render normally', () => {
    expect(mount(<ConnectionTypeIcon />)).toMatchSnapshot();
    expect(mount(<ConnectionTypeIcon type="Amazon S3" />)).toMatchSnapshot();
  });
});
