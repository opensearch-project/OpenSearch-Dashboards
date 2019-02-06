import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { withOptions } from '@storybook/addon-options';
import { addDecorator, configure } from '@storybook/react';
import './style.css';

addDecorator(
  withOptions({
    name: 'Elastic Charts',
    url: 'https://github.com/elastic/elastic-charts',
    addonPanelInRight: true,
    sidebarAnimations: true,
  }),
);
addDecorator(withKnobs);
addDecorator(
  withInfo({
    inline: true,
    source: false,
  }),
);

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
  require('../src/stories/grid.tsx');
}

configure(loadStories, module);
