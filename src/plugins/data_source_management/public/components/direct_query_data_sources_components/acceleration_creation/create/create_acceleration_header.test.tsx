/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: MIT
 */

import { shallow } from 'enzyme';
import React from 'react';
import { CreateAccelerationHeader } from './create_acceleration_header';

describe('CreateAccelerationHeader', () => {
  it('renders without crashing', () => {
    shallow(<CreateAccelerationHeader />);
  });
});
