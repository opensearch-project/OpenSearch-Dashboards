/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import React, { RefObject, createRef, useState } from 'react';
import { i18n } from '@osd/i18n';

import { EuiFieldText, EuiOutsideClickDetector, EuiPortal, Query } from '@elastic/eui';
import { SuggestionsComponent } from '../typeahead';

export interface CollapsedQueryBarInputProps {
  initialValue: string;
  onChange?: (query: string) => void;
}

export const CollapsedQueryBarInput: React.FC<CollapsedQueryBarInputProps> = (props) => {
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState<number | null>(null);
  const [value, setValue] = useState(props.initialValue ?? '');

  return (
    <EuiOutsideClickDetector onOutsideClick={() => setIsSuggestionsVisible(false)}>
      <div>
        <EuiFieldText
          data-test-subj="collapsed-query-bar-input-field-text"
          value={value}
          onClick={() => setIsSuggestionsVisible(true)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={() => setIsSuggestionsVisible(true)}
          placeholder={''}
          fullWidth
        />
        <EuiPortal>
          <SuggestionsComponent
            show={isSuggestionsVisible}
            suggestions={[]}
            index={suggestionIndex}
            onClick={(suggestion) => {
              return;
            }}
            onMouseEnter={(i) => setSuggestionIndex(i)}
            loadMore={() => {}}
            size="s"
          />
        </EuiPortal>
      </div>
    </EuiOutsideClickDetector>
  );
};
