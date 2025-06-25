/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFlavorId } from './get_flavor_id';

describe('getFlavorId', () => {
  const originalWindow = window;

  beforeEach(() => {
    // Create a mock window.location
    delete (window as any).location;
    window.location = {
      ...originalWindow.location,
      href: '',
    };
  });

  afterEach(() => {
    // Restore original window
    window.location = originalWindow.location;
  });

  it('should extract flavor ID from URL with logs flavor', () => {
    window.location.href = 'http://localhost:5601/app/explore/logs/#/something';
    expect(getFlavorId()).toBe('logs');
  });

  it('should extract flavor ID from URL with metrics flavor', () => {
    window.location.href = 'http://localhost:5601/app/explore/metrics/#/something';
    expect(getFlavorId()).toBe('metrics');
  });

  it('should return null for malformed URLs', () => {
    window.location.href = 'http://localhost:5601/app/explore//#/something';
    expect(getFlavorId()).toBeNull();
  });

  it('should handle complex URLs with query parameters', () => {
    window.location.href =
      'http://localhost:5601/app/explore/logs/#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0))';
    expect(getFlavorId()).toBe('logs');
  });
});
