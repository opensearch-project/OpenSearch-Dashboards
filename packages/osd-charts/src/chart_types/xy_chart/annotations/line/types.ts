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

import { Position } from '../../../../utils/commons';
import { AnnotationDetails, AnnotationMarker } from '../types';

/**
 * Start and end points of a line annotation
 * @internal
 */
export interface AnnotationLinePathPoints {
  /** x1,y1 the start point anchored to the linked axis */
  start: {
    x1: number;
    y1: number;
  };
  /** x2,y2 the end point */
  end: {
    x2: number;
    y2: number;
  };
}

/** @internal */
export interface AnnotationLineProps {
  /** the position of the start point relative to the Chart */
  anchor: {
    position: Position;
    top: number;
    left: number;
  };
  /**
   * The path points of a line annotation
   */
  linePathPoints: AnnotationLinePathPoints;
  details: AnnotationDetails;
  marker?: AnnotationMarker;
}
