import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { addDecorator, configure, addParameters } from '@storybook/react';

import { switchTheme } from './theme_service';

switchTheme('light');

import './style.scss';

import { create } from '@storybook/theming';

addParameters({
  options: {
    theme: create({
      base: 'light',
      brandTitle: 'Elastic Charts',
      brandUrl: 'https://github.com/elastic/elastic-charts',
      brandImage:
        'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt6ae3d6980b5fd629/5bbca1d1af3a954c36f95ed3/logo-elastic.svg',
    }),
    panelPosition: 'right',
    sidebarAnimations: true,
  },
  info: {
    inline: true,
    source: true,
    propTables: false,
    styles: {
      infoBody: {
        fontSize: '14px',
        marginTop: 0,
        marginBottom: 0,
      },
    },
  },
  docs: {},
});

addDecorator(withKnobs);
addDecorator(withInfo);

configure(require.context('../stories', true, /\.tsx$/), module);
