/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

export function useStyleControls<T>(defaultStyles: T, onChange: (newStyles: T) => void) {
  const [styles, setStyles] = useState(defaultStyles);
  const updateStyle = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const newStyles = { ...styles, [key]: value };
      setStyles(newStyles);
      onChange(newStyles);
    },
    [styles, onChange]
  );
  return { styles, updateStyle };
}
