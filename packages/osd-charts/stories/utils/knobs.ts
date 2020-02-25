import { select, array } from '@storybook/addon-knobs';

import { Rotation } from '../../src';

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

export function arrayKnobs(name: string, values: (string | number)[]): (string | number)[] {
  const stringifiedValues = values.map<string>((d) => `${d}`);
  return array(name, stringifiedValues).map<string | number>((value: string) => {
    return !isNaN(parseFloat(value)) ? parseFloat(value) : value;
  });
}
