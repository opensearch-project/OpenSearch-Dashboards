/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ExploreDataTable } from '../data_table/explore_data_table';
import { ActionBar } from './action_bar/action_bar';
import { setColumns } from '../../application/utils/state_management/slices';
import { useStatusCodeFormatter } from '../formatters/use_status_code_formatter';

export const TracesTab = () => {
  const dispatch = useDispatch();

  // Apply custom formatting for status codes
  useStatusCodeFormatter();

  // Set the default columns for traces when the component mounts
  useEffect(() => {
    dispatch(
      setColumns([
        'timestamp',
        'attributes.http.status_code',
        'status.code',
        'attributes.rpc.method',
        'serviceName',
        'durationInNanos',
      ])
    );
  }, [dispatch]);

  return (
    <div className="explore-traces-tab tab-container">
      <ActionBar />
      <ExploreDataTable />
    </div>
  );
};
