/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { MenuItemProps } from './types';

export const MenuItem = ({ label, isDisabled, onClick }: MenuItemProps) => (
  <li key={label}>
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`osd-resetFocusState
                osd:block osd:w-full osd:text-left osd:px-4 osd:py-2 osd:text-sm osd:whitespace-nowrap
                ${
                  isDisabled
                    ? 'osd:cursor-not-allowed osd:text-gray-400 osd:hover:bg-white'
                    : 'osd:hover:bg-gray-100'
                }
            `}
    >
      {label}
    </button>
  </li>
);
