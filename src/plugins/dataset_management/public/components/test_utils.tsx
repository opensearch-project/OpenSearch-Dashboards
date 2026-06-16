/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { shallow } from 'enzyme';

// since the 'shallow' from 'enzyme' doesn't support context API for React 16 and above (https://github.com/facebook/react/pull/14329)
// we use this workaround where define legacy contextTypes for react class component
export function createComponentWithContext<Props = Record<string, any>>(
  MyComponent: React.ComponentClass<any>,
  props: Props,
  mockedContext: Record<string, any>
) {
  MyComponent.contextTypes = {
    services: PropTypes.object,
  };

  // @ts-expect-error TS2322 TODO(ts-error): fixme
  return shallow(<MyComponent {...props} />, {
    context: {
      services: mockedContext,
    },
  });
}
