/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { PropsWithChildren } from 'react';

export const GlassBackground: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren) => {
  return (
    <div className="osd:bg-container-default/0.2 osd:backdrop-blur-xs osd:absolute osd:inset-0 osd:flex osd:justify-center osd:items-center osd:z-10">
      {children}
    </div>
  );
};
