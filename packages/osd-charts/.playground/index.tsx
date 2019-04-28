import '@elastic/eui/dist/eui_theme_light.css';
import React from 'react';
import ReactDOM from 'react-dom';
import '../dist/style.css';
import { Playground } from './playgroud';

ReactDOM.render(<Playground />, document.getElementById('root') as HTMLElement);
