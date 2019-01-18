import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { addDecorator, configure } from '@storybook/react';

addDecorator(withKnobs);
addDecorator(withInfo({
  inline: true,
  source: true,
}));

function loadStories() {
  require('../src/stories/bar_chart.tsx');
  require('../src/stories/line_chart.tsx');
  require('../src/stories/area_chart.tsx');
  require('../src/stories/axis.tsx');
  require('../src/stories/mixed.tsx');
  require('../src/stories/legend.tsx');
  require('../src/stories/interactions.tsx');
  require('../src/stories/rotations.tsx');
  require('../src/stories/styling.tsx');
}

configure(loadStories, module);
