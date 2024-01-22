/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useRef, useEffect } from 'react';
import { RenderFn } from '../../../services/section_type/section_type';

interface Props {
  render: RenderFn;
}

export const LazyRender: FC<Props> = ({ render }) => {
  const ref = useRef(null);

  // by using a useEffect here, we should be getting both defered rendering and also get the unmount behavior
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    // TODO: support error handling here
    return render(ref.current);
  }, [render]);

  // display: contents is used so that this component doesn't affect the rendering of the child render function
  return <div style={{ display: 'contents' }} ref={ref} />;
};
