import { SB_SOURCE_PANEL } from '../utils/storybook';

export default {
  title: 'Treemap',
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};

export { example as oneLayer } from './1_one_layer';
export { example as oneLayer2 } from './2_one_layer_2';
export { example as midTwoLayers } from './3_mid_two';
export { example as twoLayersStressTest } from './4_two_layer_stress';
export { example as multiColor } from './5_multicolor';
export { example as customStyle } from './6_custom_style';
