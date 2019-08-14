import { mount } from 'enzyme';
import * as React from 'react';
import { Position, Rendering, Rotation } from '../chart_types/xy_chart/utils/specs';
import { DARK_THEME } from '../utils/themes/dark_theme';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { TooltipType } from '../chart_types/xy_chart/utils/interactions';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';
import { DEFAULT_TOOLTIP_SNAP, DEFAULT_TOOLTIP_TYPE, SettingsComponent, SettingSpecProps } from './settings';
import { PartialTheme, BaseThemeTypes } from '../utils/themes/theme';

describe('Settings spec component', () => {
  test('should update store on mount if spec has a chart store', () => {
    const chartStore = new ChartStore();

    // component without store
    mount(<SettingsComponent rotation={90} />);
    expect(chartStore.chartRotation).toBe(0);

    mount(<SettingsComponent rotation={90} chartStore={chartStore} />);
    expect(chartStore.chartRotation).toBe(90);
  });

  test('should update store on component update', () => {
    const chartStore = new ChartStore();

    const component = mount(<SettingsComponent chartStore={chartStore} />);
    component.setProps({
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
      showLegendDisplayValue: false,
      debug: true,
      xDomain: { min: 0, max: 10 },
    });

    expect(chartStore.chartTheme).toEqual(DARK_THEME);
    expect(chartStore.chartRotation).toBe(90);
    expect(chartStore.chartRendering).toBe('svg');
    expect(chartStore.animateData).toBe(true);
    expect(chartStore.showLegend.get()).toEqual(true);
    expect(chartStore.tooltipType.get()).toEqual(TooltipType.None);
    expect(chartStore.tooltipSnap.get()).toEqual(false);
    expect(chartStore.legendPosition).toBe(Position.Bottom);
    expect(chartStore.showLegendDisplayValue.get()).toEqual(false);
    expect(chartStore.debug).toBe(true);
    expect(chartStore.customXDomain).toEqual({ min: 0, max: 10 });
  });

  test('should set chart properties on chart store', () => {
    const chartStore = new ChartStore();

    expect(chartStore.chartTheme).toEqual(LIGHT_THEME);
    expect(chartStore.chartRotation).toBe(0);
    expect(chartStore.chartRendering).toBe('canvas');
    expect(chartStore.animateData).toBe(false);
    expect(chartStore.showLegend.get()).toEqual(false);
    expect(chartStore.tooltipType.get()).toEqual(DEFAULT_TOOLTIP_TYPE);
    expect(chartStore.tooltipSnap.get()).toEqual(DEFAULT_TOOLTIP_SNAP);
    expect(chartStore.showLegendDisplayValue.get()).toEqual(true);
    expect(chartStore.legendPosition).toBeUndefined();
    expect(chartStore.debug).toBe(false);
    expect(chartStore.customXDomain).toBeUndefined();

    const updatedProps: SettingSpecProps = {
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
      showLegendDisplayValue: false,
      debug: true,
      xDomain: { min: 0, max: 10 },
    };

    mount(<SettingsComponent chartStore={chartStore} {...updatedProps} />);

    expect(chartStore.chartTheme).toEqual(DARK_THEME);
    expect(chartStore.chartRotation).toBe(90);
    expect(chartStore.chartRendering).toBe('svg');
    expect(chartStore.animateData).toBe(true);
    expect(chartStore.showLegend.get()).toEqual(true);
    expect(chartStore.tooltipType.get()).toEqual(TooltipType.None);
    expect(chartStore.tooltipSnap.get()).toEqual(false);
    expect(chartStore.legendPosition).toBe(Position.Bottom);
    expect(chartStore.showLegendDisplayValue.get()).toEqual(false);
    expect(chartStore.debug).toBe(true);
    expect(chartStore.customXDomain).toEqual({ min: 0, max: 10 });
  });

  test('should set event listeners on chart store', () => {
    const chartStore = new ChartStore();

    expect(chartStore.onElementClickListener).toBeUndefined();
    expect(chartStore.onElementOverListener).toBeUndefined();
    expect(chartStore.onElementOutListener).toBeUndefined();
    expect(chartStore.onBrushEndListener).toBeUndefined();
    expect(chartStore.onLegendItemOverListener).toBeUndefined();
    expect(chartStore.onLegendItemOutListener).toBeUndefined();
    expect(chartStore.onLegendItemClickListener).toBeUndefined();
    expect(chartStore.onLegendItemPlusClickListener).toBeUndefined();
    expect(chartStore.onLegendItemMinusClickListener).toBeUndefined();

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
    const onCursorUpdateEvent = (): void => {
      return;
    };

    const chartStoreListeners = {
      onElementClick,
      onElementOver,
      onElementOut: onOut,
      onBrushEnd,
      onLegendItemOver: onLegendEvent,
      onLegendItemOut: onOut,
      onLegendItemClick: onLegendEvent,
      onLegendItemPlusClick: onLegendEvent,
      onLegendItemMinusClick: onLegendEvent,
      onCursorUpdate: onCursorUpdateEvent,
    };

    mount(<SettingsComponent chartStore={chartStore} {...chartStoreListeners} />);
    expect(chartStore.onElementClickListener).toEqual(onElementClick);
    expect(chartStore.onElementOverListener).toEqual(onElementOver);
    expect(chartStore.onElementOutListener).toEqual(onOut);
    expect(chartStore.onBrushEndListener).toEqual(onBrushEnd);
    expect(chartStore.onLegendItemOverListener).toEqual(onLegendEvent);
    expect(chartStore.onLegendItemOutListener).toEqual(onOut);
    expect(chartStore.onLegendItemClickListener).toEqual(onLegendEvent);
    expect(chartStore.onLegendItemPlusClickListener).toEqual(onLegendEvent);
    expect(chartStore.onLegendItemMinusClickListener).toEqual(onLegendEvent);
    expect(chartStore.onCursorUpdateListener).toEqual(onCursorUpdateEvent);
  });

  test('should allow partial theme', () => {
    const chartStore = new ChartStore();
    const partialTheme: PartialTheme = {
      colors: {
        defaultVizColor: 'aquamarine',
      },
    };

    expect(chartStore.chartTheme).toEqual(LIGHT_THEME);

    const updatedProps: SettingSpecProps = {
      theme: partialTheme,
      baseThemeType: BaseThemeTypes.Dark,
      rotation: 90 as Rotation,
      rendering: 'svg' as Rendering,
      animateData: true,
      showLegend: true,
      tooltip: {
        type: TooltipType.None,
        snap: false,
      },
      legendPosition: Position.Bottom,
      showLegendDisplayValue: false,
      debug: true,
      xDomain: { min: 0, max: 10 },
    };

    mount(<SettingsComponent chartStore={chartStore} {...updatedProps} />);

    expect(chartStore.chartTheme).toEqual({
      ...DARK_THEME,
      colors: {
        ...DARK_THEME.colors,
        ...partialTheme.colors,
      },
    });
  });
});
