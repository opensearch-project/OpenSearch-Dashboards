import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from './get_settings_specs';

import { Rotation } from '../../utils/commons';
import { getChartIdSelector } from './get_chart_id';

export const getChartRotationSelector = createCachedSelector(
  [getSettingsSpecSelector],
  (settingsSpec): Rotation => {
    return settingsSpec.rotation;
  },
)(getChartIdSelector);
