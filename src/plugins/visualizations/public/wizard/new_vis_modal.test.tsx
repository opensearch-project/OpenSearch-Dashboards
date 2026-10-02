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

import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { EuiToolTip } from '@elastic/eui';
import { TypesStart, VisType } from '../vis_types';
import { NewVisModal } from './new_vis_modal';
import { ApplicationStart, SavedObjectsStart } from '../../../../core/public';
import { embeddablePluginMock } from '../../../embeddable/public/mocks';

describe('NewVisModal', () => {
  const defaultVisTypeParams = {
    hidden: false,
    visualization: class Controller {
      public render = jest.fn();
      public destroy = jest.fn();
    },
    requiresSearch: false,
    requestHandler: 'none',
    responseHandler: 'none',
  };
  const visTypeDefinitions = [
    { name: 'vis', title: 'Vis Type 1', stage: 'production', ...defaultVisTypeParams },
    { name: 'visExp', title: 'Experimental Vis', stage: 'experimental', ...defaultVisTypeParams },
    {
      name: 'visWithSearch',
      title: 'Vis with search',
      stage: 'production',
      ...defaultVisTypeParams,
    },
  ];
  const aliasDefinitions = [
    {
      name: 'visWithAliasUrl',
      title: 'Vis with alias Url',
      stage: 'production',
      aliasApp: 'otherApp',
      aliasPath: '#/aliasUrl',
    },
  ];
  const promotedAlias = {
    name: 'visAliasWithPromotion',
    title: 'Visualization editor',
    description: 'promotion description',
    icon: 'visualizeApp',
    stage: 'production',
    aliasApp: 'anotherApp',
    aliasPath: '#/anotherUrl',
    promotion: {
      description: 'promotion description',
      buttonText: 'Create visualization',
    },
  };
  const workflowAlias = {
    name: 'discoverWorkflow',
    title: 'Visualize with Discover',
    description: 'Create a visualization with Discover',
    icon: 'discoverApp',
    stage: 'production',
    aliasApp: 'discover',
    aliasPath: '#/',
  };
  const classicAlias = {
    name: 'visBuilder',
    title: 'VisBuilder',
    description: 'Create a visualization with VisBuilder',
    icon: 'visBuilder',
    stage: 'beta',
    aliasApp: 'vis-builder',
    aliasPath: '#/',
    isClassic: true,
  };

  const createVisTypes = (aliases = aliasDefinitions): TypesStart => ({
    get<T>(id: string): VisType<T> {
      return [...visTypeDefinitions, ...aliases].find(
        (vis) => vis.name === id
      ) as unknown as VisType<T>;
    },
    all: () => visTypeDefinitions as unknown as VisType[],
    getAliases: () => aliases as any,
  });

  const visTypes = createVisTypes();
  const recommendedVisTypes = createVisTypes([
    ...aliasDefinitions,
    promotedAlias,
    workflowAlias,
    classicAlias,
    {
      name: 'hiddenWorkflow',
      title: 'Hidden workflow',
      description: 'Hidden workflow',
      icon: 'discoverApp',
      stage: 'production',
      aliasApp: 'hidden',
      aliasPath: '#/',
      hidden: true,
    },
  ]);
  const addBasePath = (url: string) => `testbasepath${url}`;
  const settingsGet = jest.fn();
  const uiSettings: any = { get: settingsGet };

  beforeAll(() => {
    // jsdom 26: spy on location.assign rather than replacing the location object.
    jest.spyOn(window.location, 'assign').mockImplementation(jest.fn());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render as expected', () => {
    const wrapper = mountWithIntl(
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      <NewVisModal
        isOpen={true}
        onClose={() => null}
        visTypesRegistry={visTypes}
        addBasePath={addBasePath}
        uiSettings={uiSettings}
        application={{} as ApplicationStart}
        savedObjects={{} as SavedObjectsStart}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should show a button for regular visualizations', () => {
    const wrapper = mountWithIntl(
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      <NewVisModal
        isOpen={true}
        onClose={() => null}
        visTypesRegistry={visTypes}
        addBasePath={addBasePath}
        uiSettings={uiSettings}
        application={{} as ApplicationStart}
        savedObjects={{} as SavedObjectsStart}
      />
    );
    const visType = wrapper.find('[data-test-subj="visType-vis"]').first();
    expect(visType.exists()).toBe(true);
    expect(visType.prop('aria-describedby')).toBe('visTypeDescription-vis');

    visType.simulate('focus');
    wrapper.update();

    expect(wrapper.find('#visTypeDescription-vis').exists()).toBe(true);
  });

  it('should show the recommended editor before workflows and legacy types', () => {
    const wrapper = mountWithIntl(
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      <NewVisModal
        isOpen={true}
        onClose={() => null}
        visTypesRegistry={recommendedVisTypes}
        addBasePath={addBasePath}
        uiSettings={uiSettings}
        application={{} as ApplicationStart}
        savedObjects={{} as SavedObjectsStart}
      />
    );
    expect(
      wrapper.find('[data-test-subj="recommendedVisType-visAliasWithPromotion"]').exists()
    ).toBe(true);
    expect(wrapper.find('.visNewVisDialog__recommendedPanel').first().prop('color')).toBe(
      'primary'
    );
    expect(wrapper.find('[data-test-subj="workflowVisType-discoverWorkflow"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="workflowVisType-hiddenWorkflow"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-subj="legacyVisTypesAccordion"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="legacyVisTypesCount"]').first().text()).toContain(
      '3 types'
    );
    expect(wrapper.find('[data-test-subj="legacyVisTypesToggleLabel"]').first().text()).toContain(
      'Show types'
    );
    expect(wrapper.find('[data-test-subj="legacyVisTypesContent"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-subj="visType-vis"]').exists()).toBe(false);

    wrapper.find('button[aria-controls="legacyVisualizationTypes"]').simulate('click');
    wrapper.update();

    expect(wrapper.find('[data-test-subj="legacyVisTypesToggleLabel"]').first().text()).toContain(
      'Hide types'
    );
    expect(wrapper.find('[data-test-subj="legacyVisTypesContent"]').exists()).toBe(true);
    expect(
      wrapper
        .find('[data-test-subj="legacyVisTypesContent"]')
        .first()
        .find('.visNewVisDialog__typeSelector--fullWidth')
        .exists()
    ).toBe(true);
    expect(
      wrapper
        .find('[data-test-subj="legacyVisTypesContent"]')
        .first()
        .find('.visNewVisDialog__description')
        .exists()
    ).toBe(false);
    expect(wrapper.find('[data-test-subj="visType-vis"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-test-subj="visType-vis"]').first().prop('aria-describedby')
    ).toBeUndefined();
    const legacyTooltip = wrapper
      .find(EuiToolTip)
      .filterWhere((tooltip) => tooltip.find('[data-test-subj="visType-visBuilder"]').exists())
      .first();
    expect(legacyTooltip.exists()).toBe(true);
    const legacyTooltipContent = mountWithIntl(<div>{legacyTooltip.prop('content')}</div>);
    expect(legacyTooltipContent.find('div').first().text()).toContain(
      'Create a visualization with VisBuilder'
    );
    expect(legacyTooltipContent.find('br').exists()).toBe(true);
    expect(legacyTooltipContent.find('em').first().text()).toContain(
      'This visualization is in beta'
    );
    expect(
      wrapper.find('[data-test-subj="visType-visBuilder"]').first().prop('betaBadgeTooltipContent')
    ).toBeUndefined();
    expect(wrapper.find('[data-test-subj="visType-visBuilder"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="visType-discoverWorkflow"]').exists()).toBe(false);
  });

  it('should keep the flat selector when no recommended editor is available', () => {
    const wrapper = mountWithIntl(
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      <NewVisModal
        isOpen={true}
        onClose={() => null}
        visTypesRegistry={createVisTypes([{ ...promotedAlias, hidden: true }])}
        addBasePath={addBasePath}
        uiSettings={uiSettings}
        application={{} as ApplicationStart}
        savedObjects={{} as SavedObjectsStart}
      />
    );

    expect(
      wrapper.find('[data-test-subj="recommendedVisType-visAliasWithPromotion"]').exists()
    ).toBe(false);
    expect(wrapper.find('[data-test-subj="legacyVisTypesAccordion"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-subj="visType-vis"]').exists()).toBe(true);
  });

  describe('open editor', () => {
    it('should open the editor for visualizations without search', () => {
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={() => null}
          visTypesRegistry={visTypes}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{} as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      const visButton = wrapper.find('button[data-test-subj="visType-vis"]');
      visButton.simulate('click');
      expect(window.location.assign).toHaveBeenCalledWith(
        'testbasepath/app/visualize#/create?type=vis'
      );
    });

    it('passes through editor params to the editor URL', () => {
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={() => null}
          visTypesRegistry={visTypes}
          editorParams={['foo=true', 'bar=42']}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{} as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      const visButton = wrapper.find('button[data-test-subj="visType-vis"]');
      visButton.simulate('click');
      expect(window.location.assign).toHaveBeenCalledWith(
        'testbasepath/app/visualize#/create?type=vis&foo=true&bar=42'
      );
    });

    it('closes and redirects properly if visualization with aliasPath and originatingApp in props', () => {
      const onClose = jest.fn();
      const navigateToApp = jest.fn();
      const stateTransfer = embeddablePluginMock.createStartContract().getStateTransfer();
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={onClose}
          visTypesRegistry={visTypes}
          editorParams={['foo=true', 'bar=42']}
          originatingApp={'coolJestTestApp'}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{ navigateToApp } as unknown as ApplicationStart}
          stateTransfer={stateTransfer}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      const visButton = wrapper.find('button[data-test-subj="visType-visWithAliasUrl"]');
      visButton.simulate('click');
      expect(stateTransfer.navigateToEditor).toHaveBeenCalledWith('otherApp', {
        path: '#/aliasUrl',
        state: { originatingApp: 'coolJestTestApp' },
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('closes and redirects properly if visualization with aliasApp and without originatingApp in props', () => {
      const onClose = jest.fn();
      const navigateToApp = jest.fn();
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={onClose}
          visTypesRegistry={visTypes}
          editorParams={['foo=true', 'bar=42']}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{ navigateToApp } as unknown as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      const visButton = wrapper.find('button[data-test-subj="visType-visWithAliasUrl"]');
      visButton.simulate('click');
      expect(navigateToApp).toHaveBeenCalledWith('otherApp', { path: '#/aliasUrl' });
      expect(onClose).toHaveBeenCalled();
    });

    it('opens the recommended visualization editor through the existing alias navigation', () => {
      const onClose = jest.fn();
      const navigateToApp = jest.fn();
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={onClose}
          visTypesRegistry={recommendedVisTypes}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{ navigateToApp } as unknown as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );

      wrapper
        .find('[data-test-subj="recommendedVisType-visAliasWithPromotion"]')
        .first()
        .simulate('click');

      expect(navigateToApp).toHaveBeenCalledWith('anotherApp', { path: '#/anotherUrl' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('filter for visualization types', () => {
    it('should render as expected', () => {
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={() => null}
          visTypesRegistry={visTypes}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{} as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      const searchBox = wrapper.find('input[data-test-subj="filterVisType"]');
      searchBox.simulate('change', { target: { value: 'with' } });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('experimental visualizations', () => {
    it('should not show experimental visualizations if visualize:enableLabs is false', () => {
      settingsGet.mockReturnValue(false);
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={() => null}
          visTypesRegistry={visTypes}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{} as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      expect(wrapper.find('[data-test-subj="visType-visExp"]').exists()).toBe(false);
    });

    it('should show experimental visualizations if visualize:enableLabs is true', () => {
      settingsGet.mockReturnValue(true);
      const wrapper = mountWithIntl(
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        <NewVisModal
          isOpen={true}
          onClose={() => null}
          visTypesRegistry={visTypes}
          addBasePath={addBasePath}
          uiSettings={uiSettings}
          application={{} as ApplicationStart}
          savedObjects={{} as SavedObjectsStart}
        />
      );
      expect(wrapper.find('[data-test-subj="visType-visExp"]').exists()).toBe(true);
    });
  });
});
