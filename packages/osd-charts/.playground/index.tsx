import '@babel/polyfill';
import '@elastic/eui/dist/eui_theme_light.css';
import React from 'react';
import ReactDOM from 'react-dom';
import '../src/index.scss';
import { Playground } from './playgroud';

ReactDOM.render(<Playground />, document.getElementById('root') as HTMLElement);
