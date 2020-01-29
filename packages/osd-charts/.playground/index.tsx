import 'core-js';
import React from 'react';
import ReactDOM from 'react-dom';
import '../src/theme_light.scss';
import { Playground } from './playground';

ReactDOM.render(<Playground />, document.getElementById('root') as HTMLElement);
