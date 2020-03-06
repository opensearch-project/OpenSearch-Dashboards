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

// import React from 'react';
// import Animate from 'react-move/Animate';
// import { AreaSeriesGlyph, StackedAreaSeriesGlyph } from '../utils/area_series_utils';
// interface AreaSeriesDataProps {
//   animated?: boolean;
//   area: AreaSeriesGlyph | StackedAreaSeriesGlyph;
// }

// export class AreaSeries extends React.PureComponent<AreaSeriesDataProps> {
//   public static defaultProps: Partial<AreaSeriesDataProps> = {
//     animated: false,
//   };
//   public render() {
//     const { animated, area } = this.props;
//     // if (area.d === null) {
//     //   return null;
//     // }
//     if (!animated) {
//       if (Array.isArray(area)) {
//         return this.renderStackedAreas(area);
//       }
//       return this.renderArea(area as AreaSeriesGlyph);
//     }
//     return this.renderAnimatedArea((area as AreaSeriesGlyph).d as string);
//   }
//   private renderAnimatedArea = (d: string) => {
//     return (
//       <Animate
//       start={{
//         key: 'transform',
//         d,
//       }}
//       update={{
//         key: 'transform',
//         d: [d],
//       }}
//       >
//       {
//         (state) => {
//           return (
//             <path className="euiSeriesChartSeries_area" d={state.d as string}/>
//          );
//         }
//       }
//       </Animate>
//     );
//   }
//   private renderStackedAreas = (areas: StackedAreaSeriesGlyph) => {
//     return (
//       <g className="euiSeriesChartSeries_areaGroup">
//       {
//         areas.map((area, index) => {
//           return this.renderSingleArea(area, `area-${index}`);
//         })
//       }
//       </g>
//     );
//   }
//   private renderArea = (area: AreaSeriesGlyph) => {
//     return (
//       <g className="euiSeriesChartSeries_areaGroup">
//       {
//         this.renderSingleArea(area, 'area-1')
//       }
//       </g>
//     );
//   }
//   private renderSingleArea = (area: AreaSeriesGlyph, key: string) => {
//     return (
//       <React.Fragment key={key}>
//         <path  className="euiSeriesChartSeries_area" d={area.d as string}/>
//         {/* <g>
//           {
//             area.points.map((point) => {
//               return <circle cx={point.x} cy={point.y} r="5" />;
//             })
//           }
//         </g> */}
//       </React.Fragment>
//     );
//   }
// }
