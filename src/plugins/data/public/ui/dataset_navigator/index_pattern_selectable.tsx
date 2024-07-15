/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useCallback } from 'react';
import { EuiSelectable } from '@elastic/eui';

interface IndexPatternSelectableProps {
  indexPatternOptionList: any;
  setIndexPatternOptionList: any;
  handleSourceSelection: any;
}

export const IndexPatternSelectable = ({
  indexPatternOptionList,
  setIndexPatternOptionList,
  handleSourceSelection,
}: IndexPatternSelectableProps) => {
  const handleSourceChange = useCallback(
    (selectedOptions: any) => {
      handleSourceSelection(selectedOptions);
    },
    [handleSourceSelection]
  );

  return (
    <div>
      <EuiSelectable
        searchable
        searchProps={{ placeholder: 'Search' }}
        options={indexPatternOptionList}
        onChange={(newOptions) => {
          setIndexPatternOptionList(newOptions);
          handleSourceChange(newOptions.filter((option) => option?.checked));
        }}
        singleSelection="always"
      >
        {(list, search) => (
          <Fragment>
            {search}
            {list}
          </Fragment>
        )}
      </EuiSelectable>
    </div>
  );
};
