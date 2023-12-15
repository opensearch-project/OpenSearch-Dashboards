/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';

export const renderFn = (element: HTMLElement) => {
  ReactDOM.render(<Component />, element);
  return () => ReactDOM.unmountComponentAtNode(element);
};

const Component = () => <div>Hello world!</div>;
