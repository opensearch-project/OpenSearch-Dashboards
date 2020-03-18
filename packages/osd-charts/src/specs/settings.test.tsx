/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { mount } from 'enzyme';
import React from 'react';
import { Position, Rendering, Rotation } from '../utils/commons';
import { DARK_THEME } from '../utils/themes/dark_theme';
import { Settings, SettingsSpec, TooltipType } from './settings';
import { PartialTheme } from '../utils/themes/theme';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { chartStoreReducer, GlobalChartState } from '../state/chart_state';
import { createStore, Store } from 'redux';
import { SpecsParser } from './specs_parser';
import { Provider } from 'react-redux';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { getChartThemeSelector } from '../state/selectors/get_chart_theme';

const getProxy = (chartStore: Store<GlobalChartState>) => {
  return function SettingsProxy({ settings }: { settings?: Partial<SettingsSpec> }) {
    return (
      <Provider store={chartStore}>
        <SpecsParser>
          <Settings {...settings} />
        </SpecsParser>
      </Provider>
    );
  };
};
describe('Settings spec component', () => {
  let chartStore: Store<GlobalChartState>;
  let SettingsProxy: ({ settings }: { settings?: Partial<SettingsSpec> }) => JSX.Element;
  beforeEach(() => {
    const storeReducer = chartStoreReducer('chart_id');
    chartStore = createStore(storeReducer);
    expect(chartStore.getState().specsInitialized).toBe(false);
    SettingsProxy = getProxy(chartStore);
  });
  test('should update store on mount if spec has a chart store', () => {
    mount(
      <Provider store={chartStore}>
        <SpecsParser />
      </Provider>,
    );
    expect(getSettingsSpecSelector(chartStore.getState()).rotation).toBe(0);

    mount(
      <Provider store={chartStore}>
        <SpecsParser>
          <Settings rotation={90} />
        </SpecsParser>
      </Provider>,
    );
    expect(getSettingsSpecSelector(chartStore.getState()).rotation).toBe(90);
  });

  test('should update store on component update', () => {
    const component = mount(<SettingsProxy />);
    let settingSpec = getSettingsSpecSelector(chartStore.getState());
    expect(settingSpec.theme).toEqual(LIGHT_THEME);
    expect(settingSpec.rotation).toBe(0);
    component.setProps({
      settings: {
        theme: DARK_THEME,
        rotation: 90 as Rotation,
        rendering: 'svg' as Rendering,
        animateData: true,
        showLegend: true,
        tooltip: {
          type: TooltipType.None,
          snap: false,
        },
        legendPosition: Position.Bottom,
        showLegendExtra: false,
        debug: true,
        xDomain: { min: 0, max: 10 },
      },
    });
    settingSpec = getSettingsSpecSelector(chartStore.getState());
    expect(settingSpec.theme).toEqual(DARK_THEME);
    expect(settingSpec.rotation).toBe(90);
    expect(settingSpec.rendering).toBe('svg');
    expect(settingSpec.animateData).toBe(true);
    expect(settingSpec.showLegend).toEqual(true);
    expect(settingSpec.tooltip).toEqual({
      type: TooltipType.None,
      snap: false,
    });
    expect(settingSpec.legendPosition).toBe(Position.Bottom);
    expect(settingSpec.showLegendExtra).toEqual(false);
    expect(settingSpec.debug).toBe(true);
    expect(settingSpec.xDomain).toEqual({ min: 0, max: 10 });
  });

  test('should set event listeners on chart store', () => {
    mount(<SettingsProxy />);
    let settingSpec = getSettingsSpecSelector(chartStore.getState());

    expect(settingSpec.onElementClick).toBeUndefined();
    expect(settingSpec.onElementOver).toBeUndefined();
    expect(settingSpec.onElementOut).toBeUndefined();
    expect(settingSpec.onBrushEnd).toBeUndefined();
    expect(settingSpec.onLegendItemOver).toBeUndefined();
    expect(settingSpec.onLegendItemOut).toBeUndefined();
    expect(settingSpec.onLegendItemClick).toBeUndefined();
    expect(settingSpec.onLegendItemPlusClick).toBeUndefined();
    expect(settingSpec.onLegendItemMinusClick).toBeUndefined();

    const onElementClick = (): void => {
      return;
    };
    const onElementOver = (): void => {
      return;
    };
    const onOut = () => undefined;
    const onBrushEnd = (): void => {
      return;
    };
    const onLegendEvent = (): void => {
      return;
    };
    const onPointerUpdateEvent = (): void => {
      return;
    };
    const onRenderChangeEvent = (): void => {
      return;
    };

    const updatedProps: Partial<SettingsSpec> = {
      onElementClick,
      onElementOver,
      onElementOut: onOut,
      onBrushEnd,
      onLegendItemOver: onLegendEvent,
      onLegendItemOut: onOut,
      onLegendItemClick: onLegendEvent,
      onLegendItemPlusClick: onLegendEvent,
      onLegendItemMinusClick: onLegendEvent,
      onPointerUpdate: onPointerUpdateEvent,
      onRenderChange: onRenderChangeEvent,
    };

    mount(<SettingsProxy settings={updatedProps} />);
    settingSpec = getSettingsSpecSelector(chartStore.getState());

    expect(settingSpec.onElementClick).toEqual(onElementClick);
    expect(settingSpec.onElementOver).toEqual(onElementOver);
    expect(settingSpec.onElementOut).toEqual(onOut);
    expect(settingSpec.onBrushEnd).toEqual(onBrushEnd);
    expect(settingSpec.onLegendItemOver).toEqual(onLegendEvent);
    expect(settingSpec.onLegendItemOut).toEqual(onOut);
    expect(settingSpec.onLegendItemClick).toEqual(onLegendEvent);
    expect(settingSpec.onLegendItemPlusClick).toEqual(onLegendEvent);
    expect(settingSpec.onLegendItemMinusClick).toEqual(onLegendEvent);
    expect(settingSpec.onPointerUpdate).toEqual(onPointerUpdateEvent);
    expect(settingSpec.onRenderChange).toEqual(onRenderChangeEvent);
  });

  test('should allow partial theme', () => {
    mount(<SettingsProxy />);
    let settingSpec = getSettingsSpecSelector(chartStore.getState());
    expect(settingSpec.theme).toEqual(LIGHT_THEME);

    const partialTheme: PartialTheme = {
      colors: {
        defaultVizColor: 'aquamarine',
      },
    };

    const updatedProps: Partial<SettingsSpec> = {
      theme: partialTheme,
      baseTheme: DARK_THEME,
      rotation: 90 as Rotation,
      rendering: 'svg' as Rendering,
      animateData: true,
      showLegend: true,
      tooltip: {
        type: TooltipType.None,
        snap: false,
      },
      legendPosition: Position.Bottom,
      showLegendExtra: false,
      hideDuplicateAxes: false,
      debug: true,
      xDomain: { min: 0, max: 10 },
    };

    mount(<SettingsProxy settings={updatedProps} />);

    settingSpec = getSettingsSpecSelector(chartStore.getState());
    // the theme is no longer stored into the setting spec.
    // it's final theme object is computed through selectors
    const theme = getChartThemeSelector(chartStore.getState());
    expect(theme).toEqual({
      ...DARK_THEME,
      colors: {
        ...DARK_THEME.colors,
        ...partialTheme.colors,
      },
    });
  });
});
