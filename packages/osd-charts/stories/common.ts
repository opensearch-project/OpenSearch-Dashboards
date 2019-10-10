import { select } from '@storybook/addon-knobs';

import { Rotation } from '../src';

export const numberSelect = <T extends number>(
  name: string,
  options: { [s: string]: T },
  value: T,
  groupId?: string,
): T => (parseInt(select<T | string>(name, options, value, groupId) as string) as T) || value;

export const getChartRotationKnob = () =>
  numberSelect<Rotation>(
    'chartRotation',
    {
      '0 deg': 0,
      '90 deg': 90,
      '-90 deg': -90,
      '180 deg': 180,
    },
    0,
  );
