import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from './get_settings_specs';

import { Rotation } from '../../chart_types/xy_chart/utils/specs';
import { getChartIdSelector } from './get_chart_id';

export const getChartRotationSelector = createCachedSelector(
  [getSettingsSpecSelector],
  (settingsSpec): Rotation => {
    return settingsSpec.rotation;
  },
)(getChartIdSelector);
