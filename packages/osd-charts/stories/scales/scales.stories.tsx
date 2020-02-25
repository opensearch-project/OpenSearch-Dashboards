import { SB_KNOBS_PANEL } from '../utils/storybook';

export default {
  title: 'Scales',
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
  },
};

export { example as timezoneConfiguration } from './1_different_timezones';
export { example as tooltipInLocalTimezone } from './2_local_tooltip';
export { example as tooltipInUTC } from './3_utc_tooltip';
export { example as specifiedTimezone } from './4_specified_timezone';
export { example as removeDuplicateAxis } from './5_remove_duplicates';
