/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { shallow } from 'enzyme';
import DOMPurify from 'dompurify';
import { DocViewTableRow } from './table_row';

jest.mock('dompurify', () => ({
  sanitize: jest.fn((input) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
}));

describe('DocViewTableRow', () => {
  const defaultProps = {
    field: 'test_field',
    fieldType: 'string',
    displayNoMappingWarning: false,
    displayUnderscoreWarning: false,
    isCollapsible: false,
    isColumnActive: false,
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
    value: 'test value',
    valueRaw: 'test value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sanitizes HTML content using DOMPurify', () => {
    const maliciousValue = '<script>alert("xss")</script><p>Safe content</p>';

    shallow(<DocViewTableRow {...defaultProps} value={maliciousValue} />);

    expect(DOMPurify.sanitize).toHaveBeenCalledWith(maliciousValue);
  });

  it('renders component without dangerous script tags in HTML output', () => {
    const maliciousValue = '<script>alert("xss")</script><p>Safe content</p>';
    const wrapper = shallow(<DocViewTableRow {...defaultProps} value={maliciousValue} />);
    const html = wrapper.html();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain('Safe content');
  });
});
