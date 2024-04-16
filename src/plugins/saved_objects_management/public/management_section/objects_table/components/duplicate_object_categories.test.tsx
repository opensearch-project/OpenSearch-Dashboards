/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import RenderDuplicateObjectCategories from './duplicate_object_categories';

describe('RenderDuplicateObjectCategories', () => {
  test('renders checkboxes correctly', () => {
    const savedObjectTypeInfoMap: Map<string, [number, boolean]> = new Map([
      ['type1', [5, true]],
      ['type2', [10, false]],
    ]);
    const changeIncludeSavedObjectTypeMock = jest.fn();

    const renderDuplicateObjectCategories = RenderDuplicateObjectCategories(
      savedObjectTypeInfoMap,
      changeIncludeSavedObjectTypeMock
    );

    expect(renderDuplicateObjectCategories).toMatchSnapshot();
  });
});
