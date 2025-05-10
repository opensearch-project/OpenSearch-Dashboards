/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { DocViewRenderFn, DocViewRenderProps } from '../../../types/doc_views_types';

interface Props {
  render: DocViewRenderFn;
  renderProps: DocViewRenderProps;
}
/**
 * Responsible for rendering a tab provided by a render function.
 * The provided `render` function is called with a reference to the
 * component's `HTMLDivElement` as 1st arg and `renderProps` as 2nd arg
 */
export function DocViewRenderTab({ render, renderProps }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref && ref.current) {
      return render(ref.current, renderProps);
    }
  }, [render, renderProps]);
  return <div data-test-subj="docViewRenderTab" ref={ref} />;
}
