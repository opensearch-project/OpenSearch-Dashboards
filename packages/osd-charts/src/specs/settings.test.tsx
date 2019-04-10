import { mount } from 'enzyme';
import * as React from 'react';

import { GeometryValue } from '../lib/series/rendering';
import { DataSeriesColorsValues } from '../lib/series/series';
import { Position, Rendering, Rotation } from '../lib/series/specs';
import { DARK_THEME } from '../lib/themes/dark_theme';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { TooltipType } from '../lib/utils/interactions';
import { ChartStore } from '../state/chart_state';
import { DEFAULT_TOOLTIP_SNAP, DEFAULT_TOOLTIP_TYPE, SettingsComponent } from './settings';

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
      tooltipType: TooltipType.None,
      tooltipSnap: false,
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
    expect(chartStore.xDomain).toEqual({ min: 0, max: 10 });
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
    expect(chartStore.xDomain).toBeUndefined();

    const updatedProps = {
      theme: DARK_THEME,
      rotation: 90 as Rotation,
      rendering: 'svg' as Rendering,
      animateData: true,
      showLegend: true,
      tooltipType: TooltipType.None,
      tooltipSnap: false,
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
    expect(chartStore.xDomain).toEqual({ min: 0, max: 10 });
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

    const onElementClick = (value: GeometryValue[]): void => { return; };
    const onElementOver = (value: GeometryValue[]): void => { return; };
    const onOut = () => undefined;
    const onBrushEnd = (min: number, max: number): void => { return; };
    const onLegendEvent = (ds: DataSeriesColorsValues | null): void => { return; };

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
  });
});
