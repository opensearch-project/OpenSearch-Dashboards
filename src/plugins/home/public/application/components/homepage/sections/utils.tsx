/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
import ReactDOM from 'react-dom';
import { RenderFn } from '../../../../services/section_type/section_type';

export const renderFn = (Component: FC): RenderFn => (element: HTMLElement) => {
  ReactDOM.render(<Component />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
