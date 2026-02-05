/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { EuiSpacer } from '@elastic/eui';
import { AddFilter, Table, Header, DeleteFilterConfirmationModal } from './components';
import { DataView, DataPublicPluginStart } from '../../../../../../plugins/data/public';
import { SourceFiltersTableFilter } from './types';

export interface SourceFiltersTableProps {
  dataset: DataView;
  filterFilter: string;
  fieldWildcardMatcher: Function;
  onAddOrRemoveFilter?: Function;
  // @ts-expect-error TS2339 TODO(ts-error): fixme
  saveDataset: DataPublicPluginStart['datasets']['updateSavedObject'];
  useUpdatedUX: boolean;
}

export interface SourceFiltersTableState {
  filterToDelete: any;
  isDeleteConfirmationModalVisible: boolean;
  isSaving: boolean;
  filters: SourceFiltersTableFilter[];
}

export class SourceFiltersTable extends Component<
  SourceFiltersTableProps,
  SourceFiltersTableState
> {
  // Source filters do not have any unique ids, only the value is stored.
  // To ensure we can create a consistent and expected UX when managing
  // source filters, we are assigning a unique id to each filter on the
  // client side only
  private clientSideId: number = 0;

  constructor(props: SourceFiltersTableProps) {
    super(props);

    this.state = {
      filterToDelete: undefined,
      isDeleteConfirmationModalVisible: false,
      isSaving: false,
      filters: [],
    };
  }

  UNSAFE_componentWillMount() {
    this.updateFilters();
  }

  updateFilters = () => {
    const sourceFilters = this.props.dataset.sourceFilters;
    const filters = (sourceFilters || []).map((sourceFilter: any) => ({
      ...sourceFilter,
      clientId: ++this.clientSideId,
    }));

    this.setState({ filters });
  };

  getFilteredFilters = createSelector(
    (state: SourceFiltersTableState) => state.filters,
    (state: SourceFiltersTableState, props: SourceFiltersTableProps) => props.filterFilter,
    (filters, filterFilter) => {
      if (filterFilter) {
        const filterFilterToLowercase = filterFilter.toLowerCase();
        return filters.filter((filter) =>
          filter.value.toLowerCase().includes(filterFilterToLowercase)
        );
      }

      return filters;
    }
  );

  startDeleteFilter = (filter: SourceFiltersTableFilter) => {
    this.setState({
      filterToDelete: filter,
      isDeleteConfirmationModalVisible: true,
    });
  };

  hideDeleteConfirmationModal = () => {
    this.setState({
      filterToDelete: undefined,
      isDeleteConfirmationModalVisible: false,
    });
  };

  deleteFilter = async () => {
    const { dataset, onAddOrRemoveFilter, saveDataset } = this.props;
    const { filterToDelete, filters } = this.state;

    dataset.sourceFilters = filters.filter((filter) => {
      return filter.clientId !== filterToDelete.clientId;
    });

    this.setState({ isSaving: true });
    await saveDataset(dataset);

    if (onAddOrRemoveFilter) {
      onAddOrRemoveFilter();
    }

    this.updateFilters();
    this.setState({ isSaving: false });
    this.hideDeleteConfirmationModal();
  };

  onAddFilter = async (value: string) => {
    const { dataset, onAddOrRemoveFilter, saveDataset } = this.props;

    dataset.sourceFilters = [...(dataset.sourceFilters || []), { value }];

    this.setState({ isSaving: true });
    await saveDataset(dataset);

    if (onAddOrRemoveFilter) {
      onAddOrRemoveFilter();
    }

    this.updateFilters();
    this.setState({ isSaving: false });
  };

  saveFilter = async ({ clientId, value }: SourceFiltersTableFilter) => {
    const { dataset, saveDataset } = this.props;
    const { filters } = this.state;

    dataset.sourceFilters = filters.map((filter) => {
      if (filter.clientId === clientId) {
        return {
          value,
          clientId,
        };
      }

      return filter;
    });

    this.setState({ isSaving: true });
    await saveDataset(dataset);
    this.updateFilters();
    this.setState({ isSaving: false });
  };

  render() {
    const { dataset, fieldWildcardMatcher } = this.props;
    const { isSaving, filterToDelete } = this.state;
    const filteredFilters = this.getFilteredFilters(this.state, this.props);

    return (
      <>
        <Header />
        <AddFilter useUpdatedUX={this.props.useUpdatedUX} onAddFilter={this.onAddFilter} />
        <EuiSpacer size="l" />
        <Table
          isSaving={isSaving}
          dataset={dataset}
          items={filteredFilters}
          fieldWildcardMatcher={fieldWildcardMatcher}
          deleteFilter={this.startDeleteFilter}
          saveFilter={this.saveFilter}
        />

        {filterToDelete && (
          <DeleteFilterConfirmationModal
            filterToDeleteValue={filterToDelete.value}
            onCancelConfirmationModal={this.hideDeleteConfirmationModal}
            onDeleteFilter={this.deleteFilter}
          />
        )}
      </>
    );
  }
}
