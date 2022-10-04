/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WizardServices } from '../../types';
import { getOnSave } from './get_top_nav_config';
import { createWizardServicesMock } from './mocks';

describe('getOnSave', () => {
  let savedWizardVis: any;
  let originatingApp: string | undefined;
  let visualizationIdFromUrl: string;
  let dispatch: any;
  let mockServices: jest.Mocked<WizardServices>;
  let onSaveProps: {
    newTitle: string;
    newCopyOnSave: boolean;
    isTitleDuplicateConfirmed: boolean;
    onTitleDuplicate: any;
    newDescription: string;
    returnToOrigin: boolean;
  };

  beforeEach(() => {
    savedWizardVis = {
      id: '1',
      title: 'save wizard wiz title',
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
    mockServices = createWizardServicesMock();

    onSaveProps = {
      newTitle: 'new title',
      newCopyOnSave: false,
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: jest.fn(),
      newDescription: 'new description',
      returnToOrigin: true,
    };
  });

  test('return undefined when savedWizardVis is null', async () => {
    savedWizardVis = null;
    const onSave = getOnSave(
      savedWizardVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);

    expect(onSaveResult).toBeUndefined();
  });

  test('savedWizardVis get saved correctly', async () => {
    const onSave = getOnSave(
      savedWizardVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveReturn = await onSave(onSaveProps);
    expect(savedWizardVis).toMatchInlineSnapshot(`
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

  test('savedWizardVis does not change title with a null id', async () => {
    savedWizardVis.save = jest.fn().mockReturnValue(null);
    const onSave = getOnSave(
      savedWizardVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(savedWizardVis.title).toBe('save wizard wiz title');
    expect(onSaveResult?.id).toBeNull();
  });

  test('create a new wizard from dashboard', async () => {
    savedWizardVis.id = undefined;
    savedWizardVis.save = jest.fn().mockReturnValue('2');
    originatingApp = 'dashboard';
    onSaveProps.returnToOrigin = true;

    const onSave = getOnSave(
      savedWizardVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(onSaveResult?.id).toBe('2');
    expect(dispatch).toBeCalledTimes(0);
  });

  test('edit an exising wizard from dashboard', async () => {
    savedWizardVis.copyOnSave = false;
    onSaveProps.newDescription = 'new description after editing';
    originatingApp = 'dashboard';
    onSaveProps.returnToOrigin = true;
    const onSave = getOnSave(
      savedWizardVis,
      originatingApp,
      visualizationIdFromUrl,
      dispatch,
      mockServices
    );
    const onSaveResult = await onSave(onSaveProps);
    expect(onSaveResult?.id).toBe('1');
    expect(mockServices.application.navigateToApp).toBeCalledTimes(1);
    expect(savedWizardVis.description).toBe('new description after editing');
  });
});
