/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';

export const renderFn = (element: HTMLElement) => {
  // eslint-disable-next-line no-console
  console.log('mount');
  ReactDOM.render(<Component />, element);

  return () => {
    // eslint-disable-next-line no-console
    console.log('unmount');
    ReactDOM.unmountComponentAtNode(element);
  };
};

const Component = () => <div>Hello world!</div>;
