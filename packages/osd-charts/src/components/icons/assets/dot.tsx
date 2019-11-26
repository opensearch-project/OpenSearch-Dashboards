import React from 'react';
import { Props } from '../icon';

export class DotIcon extends React.PureComponent<Props> {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...this.props}>
        <defs>
          <circle id="dot-a" cx="8" cy="8" r="4" />
        </defs>
        <g>
          <use xlinkHref="#dot-a" />
        </g>
      </svg>
    );
  }
}
