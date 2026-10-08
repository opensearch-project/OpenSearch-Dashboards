/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { getIcon } from './icons.utils';

describe('getIcon', () => {
  const imgs = (type: string) =>
    Array.from(render(<>{getIcon(type)}</>).container.querySelectorAll('img'));

  it('marks brand icons and leaves monochrome icons unmarked', () => {
    expect(imgs('Dependency::postgresql')[0]).toHaveClass('celBrandIcon');
    expect(imgs('Dependency::database')[0].className).toBe('');
    expect(imgs('AWS::RDS')[0].className).toBe('');
  });

  it('renders a mark with a vendor light version twice, one per theme', () => {
    const [light, dark] = imgs('Dependency::microsoft.sql_server');
    expect(light).toHaveClass('celBrandIcon', 'celBrandIcon--lightTheme');
    expect(dark).toHaveClass('celBrandIcon', 'celBrandIcon--darkTheme');
  });
});
