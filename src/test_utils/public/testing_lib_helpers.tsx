/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { render as rtlRender, RenderResult } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

// src: https://testing-library.com/docs/example-react-intl/#creating-a-custom-render-function
function render(ui: ReactElement, { ...renderOptions } = {}): RenderResult {
  const Wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return <I18nProvider>{children}</I18nProvider>;
  };
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render };
