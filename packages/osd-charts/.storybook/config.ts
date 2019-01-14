import { withInfo } from '@storybook/addon-info';
import { addDecorator, configure } from '@storybook/react';

addDecorator(
  withInfo({
    styles: {
      header: {
        h1: {
          marginRight: '20px',
          fontSize: '25px',
          display: 'inline',
        },
        body: {
          marginTop: 0,
          paddingTop: 0,
          paddingBottom: 0,
        },
        h2: {
          display: 'inline',
          color: '#999',
        },
      },
      infoBody: {
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: '#eee',
        padding: '0px 5px',
        lineHeight: '2',
      },
    },
    inline: true,
    source: true,
  }),
);

function loadStories() {
  require('../src/stories/bar_chart.tsx');
  require('../src/stories/line_chart.tsx');
  require('../src/stories/area_chart.tsx');
  require('../src/stories/axis.tsx');
  require('../src/stories/mixed.tsx');
  require('../src/stories/legend.tsx');
}

configure(loadStories, module);
