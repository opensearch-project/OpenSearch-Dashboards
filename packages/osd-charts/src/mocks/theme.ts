/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { RecursivePartial, mergePartial } from '../utils/commons';
import {
  GeometryStateStyle,
  RectBorderStyle,
  RectStyle,
  AreaStyle,
  LineStyle,
  PointStyle,
} from '../utils/themes/theme';

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

export class MockStyles {
  static rect(partial: RecursivePartial<RectStyle> = {}): RectStyle {
    return mergePartial(
      {
        fill: 'blue',
        opacity: 1,
      },
      partial,
    );
  }

  static rectBorder(partial: RecursivePartial<RectBorderStyle> = {}): RectBorderStyle {
    return mergePartial(
      {
        visible: false,
        stroke: 'blue',
        strokeWidth: 1,
        strokeOpacity: 1,
      },
      partial,
    );
  }

  static area(partial: RecursivePartial<AreaStyle> = {}): AreaStyle {
    return mergePartial(
      {
        visible: true,
        fill: 'blue',
        opacity: 1,
      },
      partial,
    );
  }

  static line(partial: RecursivePartial<LineStyle> = {}): LineStyle {
    return mergePartial(
      {
        visible: true,
        stroke: 'blue',
        strokeWidth: 1,
        opacity: 1,
        dash: [1, 2, 1],
      },
      partial,
    );
  }

  static point(partial: RecursivePartial<PointStyle> = {}): PointStyle {
    return mergePartial(
      {
        visible: true,
        stroke: 'blue',
        strokeWidth: 1,
        fill: 'blue',
        opacity: 1,
        radius: 10,
      },
      partial,
    );
  }

  static geometryState(partial: RecursivePartial<GeometryStateStyle> = {}): GeometryStateStyle {
    return mergePartial(
      {
        opacity: 1,
      },
      partial,
    );
  }
}
