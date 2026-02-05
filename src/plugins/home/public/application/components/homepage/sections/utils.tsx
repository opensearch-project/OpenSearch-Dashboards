/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { createRoot, Root } from 'react-dom/client';
import { RenderFn } from '../../../../services/section_type/section_type';

export const renderFn = (Component: FC): RenderFn => (element: HTMLElement) => {
  const root = createRoot(element);
  root.render(<Component />);

  return () => root.unmount();
};
