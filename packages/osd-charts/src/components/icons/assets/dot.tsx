import React from 'react';
import { Props } from '../icon';

export function DotIcon(extraProps: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...extraProps}>
      <defs>
        <circle id="dot-a" cx="8" cy="8" r="4" />
      </defs>
      <g>
        <use xlinkHref="#dot-a" />
      </g>
    </svg>
  );
}
