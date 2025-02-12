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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  EuiSmallButtonEmpty,
  EuiSmallButton,
  EuiForm,
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiCompressedSwitch,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiButton,
  EuiCompressedCheckbox,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { sortBy, isEqual } from 'lodash';
import { SavedQuery, SavedQueryService } from '../..';
import { SavedQueryAttributes } from '../../query';
import { SavedQueryMeta } from './save_query_form';

interface Props {
  savedQuery?: SavedQueryAttributes;
  savedQueryService: SavedQueryService;
  onSave: (savedQueryMeta: SavedQueryMeta) => void;
  onClose: () => void;
  formUiType: 'Modal' | 'Flyout';
  showFilterOption?: boolean;
  showTimeFilterOption?: boolean;
  saveAsNew?: boolean;
  setSaveAsNew?: (shouldSaveAsNew: boolean) => void;
  cannotBeOverwritten?: boolean;
}

export function useSaveQueryFormContent({
  savedQuery,
  savedQueryService,
  onSave,
  onClose,
  showFilterOption = true,
  showTimeFilterOption = true,
  formUiType,
  saveAsNew,
  setSaveAsNew,
  cannotBeOverwritten,
}: Props) {
  const [title, setTitle] = useState('');
  const [enabledSaveButton, setEnabledSaveButton] = useState(false);
  const [description, setDescription] = useState('');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [shouldIncludeFilters, setShouldIncludeFilters] = useState(true);
  // Defaults to false because saved queries are meant to be as portable as possible and loading
  // a saved query with a time filter will override whatever the current value of the global timepicker
  // is. We expect this option to be used rarely and only when the user knows they want this behavior.
  const [shouldIncludeTimeFilter, setIncludeTimefilter] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Need this effect so that in case when user select "Save as new" in the flyout,
  // the initial state resets since savedQuery will be undefined
  useEffect(() => {
    setTitle(savedQuery?.title || '');
    setEnabledSaveButton(Boolean(savedQuery));
    setDescription(savedQuery?.description || '');
    setShouldIncludeFilters(savedQuery ? !!savedQuery.filters : true);
    setIncludeTimefilter(!!savedQuery?.timefilter);
    setFormErrors([]);
  }, [savedQuery]);

  const titleConflictErrorText = i18n.translate(
    'data.search.searchBar.savedQueryForm.titleConflictText',
    {
      defaultMessage: 'Name conflicts with an existing saved query',
    }
  );

  const savedQueryDescriptionText = i18n.translate(
    'data.search.searchBar.savedQueryDescriptionText',
    {
      defaultMessage: 'Save query text and filters that you want to use again.',
    }
  );

  useEffect(() => {
    const fetchQueries = async () => {
      const allSavedQueries = await savedQueryService.getAllSavedQueries();
      const sortedAllSavedQueries = sortBy(allSavedQueries, 'attributes.title') as SavedQuery[];
      setSavedQueries(sortedAllSavedQueries);
    };
    fetchQueries();
  }, [savedQueryService]);

  const validate = useCallback(() => {
    const errors = [];
    if (
      !savedQuery &&
      savedQueries.some((existingSavedQuery) => existingSavedQuery.attributes.title === title)
    ) {
      errors.push(titleConflictErrorText);
    }

    if (!isEqual(errors, formErrors)) {
      setFormErrors(errors);
      return false;
    }

    return !formErrors.length;
  }, [savedQueries, savedQuery, title, titleConflictErrorText, formErrors]);

  const onClickSave = useCallback(() => {
    if (validate()) {
      onSave({
        title,
        description,
        shouldIncludeFilters,
        shouldIncludeTimeFilter,
      });
    }
  }, [validate, onSave, title, description, shouldIncludeFilters, shouldIncludeTimeFilter]);

  const onInputChange = useCallback((event) => {
    setEnabledSaveButton(Boolean(event.target.value));
    setFormErrors([]);
    setTitle(event.target.value);
  }, []);

  const autoTrim = useCallback(() => {
    const trimmedTitle = title.trim();
    if (title.length > trimmedTitle.length) {
      setTitle(trimmedTitle);
    }
  }, [title]);

  const hasErrors = formErrors.length > 0;

  const saveQueryFormBody = (
    <EuiForm isInvalid={hasErrors} error={formErrors} data-test-subj="saveQueryForm">
      <EuiCompressedFormRow>
        <EuiText size="s" color="subdued">
          {savedQueryDescriptionText}
        </EuiText>
      </EuiCompressedFormRow>
      {formUiType === 'Flyout' && (
        <EuiCompressedFormRow>
          <EuiCompressedCheckbox
            id="save-as-new-query"
            onChange={(event) => setSaveAsNew?.(event.target.checked)}
            checked={saveAsNew}
            data-test-subj="saveAsNewQueryCheckbox"
            label={i18n.translate('data.search.searchBar.SaveAsNewLabelText', {
              defaultMessage: 'Save as new query',
            })}
            disabled={cannotBeOverwritten}
          />
        </EuiCompressedFormRow>
      )}
      <EuiCompressedFormRow
        label={i18n.translate('data.search.searchBar.savedQueryNameLabelText', {
          defaultMessage: 'Name',
        })}
        helpText={i18n.translate('data.search.searchBar.savedQueryNameHelpText', {
          defaultMessage: 'Name is required and must be unique without leading or trailing spaces.',
        })}
        isInvalid={hasErrors}
      >
        <EuiCompressedFieldText
          disabled={!!savedQuery}
          value={title}
          name="title"
          onChange={onInputChange}
          data-test-subj="saveQueryFormTitle"
          isInvalid={hasErrors}
          onBlur={autoTrim}
        />
      </EuiCompressedFormRow>

      <EuiCompressedFormRow
        label={i18n.translate('data.search.searchBar.savedQueryDescriptionLabelText', {
          defaultMessage: 'Description',
        })}
      >
        <EuiCompressedFieldText
          value={description}
          name="description"
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          data-test-subj="saveQueryFormDescription"
        />
      </EuiCompressedFormRow>
      {showFilterOption && (
        <EuiCompressedFormRow>
          <EuiCompressedSwitch
            name="shouldIncludeFilters"
            label={i18n.translate('data.search.searchBar.savedQueryIncludeFiltersLabelText', {
              defaultMessage: 'Include filters',
            })}
            checked={shouldIncludeFilters}
            onChange={() => {
              setShouldIncludeFilters(!shouldIncludeFilters);
            }}
            data-test-subj="saveQueryFormIncludeFiltersOption"
          />
        </EuiCompressedFormRow>
      )}

      {showTimeFilterOption && (
        <EuiCompressedFormRow>
          <EuiCompressedSwitch
            name="shouldIncludeTimeFilter"
            label={i18n.translate('data.search.searchBar.savedQueryIncludeTimeFilterLabelText', {
              defaultMessage: 'Include time filter',
            })}
            checked={shouldIncludeTimeFilter}
            onChange={() => {
              setIncludeTimefilter(!shouldIncludeTimeFilter);
            }}
            data-test-subj="saveQueryFormIncludeTimeFilterOption"
          />
        </EuiCompressedFormRow>
      )}
    </EuiForm>
  );

  const footer =
    formUiType === 'Modal' ? (
      <>
        <EuiSmallButtonEmpty onClick={onClose} data-test-subj="savedQueryFormCancelButton">
          {i18n.translate('data.search.searchBar.savedQueryFormCancelButtonText', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>

        <EuiSmallButton
          onClick={onClickSave}
          fill
          data-test-subj="savedQueryFormSaveButton"
          disabled={hasErrors || !enabledSaveButton}
        >
          {i18n.translate('data.search.searchBar.savedQueryFormSaveButtonText', {
            defaultMessage: 'Save',
          })}
        </EuiSmallButton>
      </>
    ) : (
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty iconType={'cross'} color="danger" iconSide="left" onClick={onClose}>
            {i18n.translate('data.search.searchBar.savedQueryFormCancelButtonText', {
              defaultMessage: 'Cancel',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            disabled={hasErrors || !enabledSaveButton}
            onClick={onClickSave}
            data-test-subj="savedQueryFormSaveButton"
          >
            {i18n.translate('data.search.searchBar.savedQueryFlyoutFormSaveButtonText', {
              defaultMessage: '{saveText}',
              values: { saveText: savedQuery ? 'Save changes' : 'Save' },
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );

  return {
    header: (
      <EuiText size="s">
        <h2>
          {i18n.translate('data.search.searchBar.savedQueryFormTitle', {
            defaultMessage: 'Save query',
          })}
        </h2>
      </EuiText>
    ),
    body: saveQueryFormBody,
    footer,
  };
}
