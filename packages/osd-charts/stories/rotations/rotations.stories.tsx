import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Rotations',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as withOrdinalAxis } from './1_ordinal';
export { example as negative90DegreeOrdinal } from './2_negative_ordinal';
export { example as rotations0DegOrdinal } from './3_rotations_ordinal';
export { example as rotations90DegOrdinal } from './4_90_ordinal';
export { example as rotations180DegOrdinal } from './5_180_ordinal';
export { example as negative90DegLinear } from './6_negative_linear';
export { example as rotations0DegLinear } from './7_rotations_linear';
export { example as rotations90DegLinear } from './8_90_deg_linear';
export { example as rotations180DegLinear } from './9_180_deg_linear';
