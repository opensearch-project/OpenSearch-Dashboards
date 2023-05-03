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

import React, { useState, useEffect } from 'react';
import { EuiSwitch, EuiFormRow, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AggParamEditorProps } from '../agg_param_props';
import { OSD_FIELD_TYPES } from '../../../../../plugins/data/common';

function UseGeocentroidParamEditor({ agg, value = false, setValue }: AggParamEditorProps<boolean>) {
  const [disabled, setDisabled] = useState(false);

  const label = i18n.translate('visDefaultEditor.controls.placeMarkersOffGridLabel', {
    defaultMessage: 'Place markers off grid (use geocentroid)',
  });

  const tooltipLabel = i18n.translate(
    'visDefaultEditor.controls.placeMarkersOffGridLabelUnsupport',
    {
      defaultMessage: 'Currently geo_shape type field does not support centroid aggregation.',
    }
  );

  useEffect(() => {
    // geo_shape type field does not support centroid aggregation
    if (agg?.params?.field?.type === OSD_FIELD_TYPES.GEO_SHAPE) {
      setDisabled(true);
      setValue(false);
    } else {
      setDisabled(false);
    }
  }, [agg, setValue]);

  return (
    <EuiFormRow display={'rowCompressed'}>
      {disabled ? (
        <EuiToolTip content={tooltipLabel}>
          <EuiSwitch
            compressed={true}
            disabled={true}
            label={label}
            checked={value}
            onChange={(ev) => setValue(ev.target.checked)}
          />
        </EuiToolTip>
      ) : (
        <EuiSwitch
          compressed={true}
          disabled={false}
          label={label}
          checked={value}
          onChange={(ev) => setValue(ev.target.checked)}
        />
      )}
    </EuiFormRow>
  );
}

export { UseGeocentroidParamEditor };
