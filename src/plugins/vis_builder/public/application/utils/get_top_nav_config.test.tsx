/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../../types';
import { getOnSave } from './get_top_nav_config';
import { createVisBuilderServicesMock } from './mocks';

describe('getOnSave', () => {
  let savedVisBuilderVis: any;
  let originatingApp: string | undefined;
  let visualizationIdFromUrl: string;
  let dispatch: any;
  let mockServices: jest.Mocked<VisBuilderServices>;
  let onSaveProps: {
    newTitle: string;
    newCopyOnSave: boolean;
    isTitleDuplicateConfirmed: boolean;
    onTitleDuplicate: any;
    newDescription: string;
    returnToOrigin: boolean;
  };

  beforeEach(() => {
    savedVisBuilderVis = {
      id: '1',
      title: 'save visBuilder wiz title',
      description: '',
      visualizationState: '',
      styleState: '',
      version: 0,
      copyOnSave: true,
      searchSourceFields: {},
      save: jest.fn().mockReturnValue('1'),
    };
    originatingApp = '';
    visualizationIdFromUrl = '';
    dispatch = jest.fn();
    mockServices = createVisBuilderServicesMock();

    onSaveProps = {
      newTitle: 'new title',
      newCopyOnSave: false,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: jest.fn(),
      newDescription: 'new description',
      returnToOrigin: true,
    };
  });

  test('return undefined when savedVisBuilderVis is null', async () => {
    savedVisBuilderVis = null;
    const onSave = getOnSave(
      savedVisBuilderVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);

    expect(onSaveResult).toBeUndefined();
  });

  test('savedVisBuilderVis get saved correctly', async () => {
    const onSave = getOnSave(
      savedVisBuilderVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveReturn = await onSave(onSaveProps);
    expect(savedVisBuilderVis).toMatchInlineSnapshot(`
      Object {
        "copyOnSave": false,
        "description": "new description",
        "id": "1",
        "save": [MockFunction] {
          "calls": Array [
            Array [
              Object {
                "confirmOverwrite": false,
                "isTitleDuplicateConfirmed": false,
                "onTitleDuplicate": [MockFunction],
                "returnToOrigin": true,
              },
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": "1",
            },
          ],
        },
        "searchSourceFields": Object {},
        "styleState": "",
        "title": "new title",
        "version": 0,
        "visualizationState": "",
      }
    `);
    expect(onSaveReturn?.id).toBe('1');
  });

  test('savedVisBuilderVis does not change title with a null id', async () => {
    savedVisBuilderVis.save = jest.fn().mockReturnValue(null);
    const onSave = getOnSave(
      savedVisBuilderVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(savedVisBuilderVis.title).toBe('save visBuilder wiz title');
    expect(onSaveResult?.id).toBeNull();
  });

  test('create a new visBuilder from dashboard', async () => {
    savedVisBuilderVis.id = undefined;
    savedVisBuilderVis.save = jest.fn().mockReturnValue('2');
    originatingApp = 'dashboard';
    onSaveProps.returnToOrigin = true;

    const onSave = getOnSave(
      savedVisBuilderVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(onSaveResult?.id).toBe('2');
    expect(dispatch).toBeCalledTimes(0);
  });

  test('edit an exising visBuilder from dashboard', async () => {
    savedVisBuilderVis.copyOnSave = false;
    onSaveProps.newDescription = 'new description after editing';
    originatingApp = 'dashboard';
    onSaveProps.returnToOrigin = true;
    const onSave = getOnSave(
      savedVisBuilderVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(onSaveResult?.id).toBe('1');
    expect(mockServices.application.navigateToApp).toBeCalledTimes(1);
    expect(savedVisBuilderVis.description).toBe('new description after editing');
  });
});
