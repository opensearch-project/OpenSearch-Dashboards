/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentManagementService } from './content_management_service';

test('it should register pages', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1' });
  cms.registerPage({ id: 'page2' });

  expect(cms.getPage('page1')).not.toBeUndefined();
  expect(cms.getPage('page2')).not.toBeUndefined();
});

test('it register page with sections', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  expect(cms.getPage('page1')?.getSections()).toHaveLength(1);
});

test('it should throw error when register page with the same id', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1' });
  expect(() => cms.registerPage({ id: 'page1' })).toThrowError();
});

test('it register content provider', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  cms.registerContentProvider({
    id: 'content_provider1',
    getTargetArea() {
      return 'page1/section1';
    },
    getContent() {
      return {
        kind: 'card',
        id: 'content1',
        title: 'card',
        description: 'descriptions',
        order: 0,
      };
    },
  });
  expect(cms.getPage('page1')?.getContents('section1')).toHaveLength(1);
});

test('it register content provider to multiple destination', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  cms.registerPage({ id: 'page2', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  cms.registerContentProvider({
    id: 'content_provider1',
    getTargetArea() {
      return ['page1/section1', 'page2/section1'];
    },
    getContent() {
      return {
        kind: 'card',
        id: 'content1',
        title: 'card',
        description: 'descriptions',
        order: 0,
      };
    },
  });
  expect(cms.getPage('page1')?.getContents('section1')).toHaveLength(1);
  expect(cms.getPage('page2')?.getContents('section1')).toHaveLength(1);
});

test('it should throw error when register content provider with invalid target area', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  expect(() =>
    cms.registerContentProvider({
      id: 'content_provider1',
      getTargetArea() {
        // valid area should be in format `${pageId}/${sectionId}`
        return 'invalid_target_area';
      },
      getContent() {
        return {
          kind: 'card',
          id: 'content1',
          title: 'card',
          description: 'descriptions',
          order: 0,
        };
      },
    })
  ).toThrowError();
});

test('it should throw error if update page section with invalid target area', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  expect(() => cms.updatePageSection('invalid_target_area', jest.fn())).toThrowError();
});

test('it should update page section', () => {
  const cms = new ContentManagementService();
  cms.registerPage({ id: 'page1', sections: [{ id: 'section1', kind: 'card', order: 0 }] });
  cms.updatePageSection(
    'page1/section1',
    jest.fn().mockReturnValue({ id: 'section1', kind: 'card', input: { title: 'new title' } })
  );
  expect(cms.getPage('page1')?.getSections()).toHaveLength(1);
  expect(cms.getPage('page1')?.getSections()[0]).toEqual({
    id: 'section1',
    kind: 'card',
    order: 0,
    input: { title: 'new title' },
  });
});
