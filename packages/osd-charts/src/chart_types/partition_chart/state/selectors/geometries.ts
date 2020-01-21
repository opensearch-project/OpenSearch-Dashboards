import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSpecsFromStore } from '../../../../state/utils';
import { ChartTypes } from '../../..';
import { render } from './scenegraph';
import { nullSectorViewModel, ShapeViewModel } from '../../layout/types/viewmodel_types';
import { PartitionSpec } from '../../specs/index';
import { SpecTypes } from '../../../../specs/settings';

const getSpecs = (state: GlobalChartState) => state.specs;

const getParentDimensions = (state: GlobalChartState) => state.parentDimensions;

export const partitionGeometries = createCachedSelector(
  [getSpecs, getParentDimensions, getChartThemeSelector],
  (specs, parentDimensions, theme): ShapeViewModel => {
    const pieSpecs = getSpecsFromStore<PartitionSpec>(specs, ChartTypes.Partition, SpecTypes.Series);
    return pieSpecs.length === 1 ? render(pieSpecs[0], parentDimensions, theme) : nullSectorViewModel();
  },
)((state) => state.chartId);
