import { configure } from '@storybook/react';
import {addDecorator} from "@storybook/react";
import {withInfo} from '@storybook/addon-info';


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
          paddingTop: 0,
          paddingBottom: 0,
        },
        h2: {
          display: 'inline',
          color: '#999',
        },
      },
      infoBody: {
        backgroundColor: '#eee',
        padding: '0px 5px',
        lineHeight: '2',
      },
    },
    inline: true,
    source: false,
  })
);

function loadStories() {
  require('../src/stories/simple_bar_chart.tsx');
  require('../src/stories/simple_line_chart.tsx');
  require('../src/stories/simple_area_chart.tsx');
  require('../src/stories/axis.tsx');
}

configure(loadStories, module);