/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Whether metric previews (the browser's sparklines) may load.
 *
 * For a dataset type that requires an explicit Run (`meta.requiresExplicitRun`), previews stay off
 * until the user asks for them, through `requestPreviews` (a "Load previews" action or a Run /
 * refresh), and turn off again when `resetKey` changes, such as on a dataset switch (pass a value
 * that identifies the dataset, e.g. `type::id`, not an object reference). Every other
 * dataset type loads previews as before.
 */
export const usePreviewGate = (requiresExplicitRun: boolean, resetKey: string) => {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    setRequested(false);
  }, [resetKey]);

  const requestPreviews = useCallback(() => setRequested(true), []);

  return { previewsEnabled: !requiresExplicitRun || requested, requestPreviews };
};
