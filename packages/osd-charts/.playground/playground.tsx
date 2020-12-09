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
 * under the License.
 */

import React from 'react';

interface Food {
  label: string;
  count: number;
  actionLabel: string;
}

type Foods = Array<Food>;

type FoodArray = Array<string>;

export class Playground extends React.Component {
  foods: Foods = [
    { label: 'pie', count: 2, actionLabel: 'tab' },
    { label: 'asparagus', count: 5, actionLabel: 'tab' },
    { label: 'brownies', count: 0, actionLabel: 'enter' },
    { label: 'popsicles', count: 3, actionLabel: 'enter' },
  ];

  foodsAsAnArray: FoodArray = ['tab', 'tab', 'tab', 'enter'];

  getFoodsArrayAction = (foodsArray: FoodArray) => {
    for (let i = 0; i < foodsArray.length; i++) {
      if (foodsArray[i] === 'tab') {
        // alert('tab!');
      } else if (foodsArray[i] === 'enter') {
        // alert('enter!');
      }
    }
  };

  getFoodAction = (foodLabel: Food[keyof Food]) => {
    // eslint-disable-next-line array-callback-return
    return this.foods.map(({ label, count, actionLabel }) => {
      if (foodLabel === label && actionLabel === 'tab') {
        let c = 0;
        while (c < count) {
          // alert(`${label} Tab!`);
          c++;
        }
      } else if (foodLabel === label && actionLabel === 'enter') {
        let c = 0;
        while (c < count) {
          // alert(`${label} Enter!`);
          c++;
        }
      }
    });
  };

  makingFood = (ms: number, food: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // console.log(`resolving the promise ${food}`, new Date());
        resolve(`done with ${food}`);
      }, ms);
      // console.log(`starting the promise ${food}`, new Date());
    });
  };

  getNumberOfFood = (food: any) => {
    return this.makingFood(1000, food).then(() => this.getFoodAction(food));
  };

  getNumberOfFoodArray = () => {
    return this.makingFood(1000, 'apple').then(() => this.getFoodsArrayAction(this.foodsAsAnArray));
  };

  getAsyncNumberOfFoodArray = async () => {
    // const result = await this.makingFood(2000).then(() => this.getFoodsArrayAction(this.foodsAsAnArray));
    // alert(result);
  };

  // forLoop = async () => {
  // alert('start');
  // for (let index = 0; index < this.foods.length; index++) {
  //   const foodLabel = this.foods[index].label;
  //   const numFood = await this.getFoodNumber(foodLabel);
  //   alert(numFood);
  // }
  // const foodsPromiseArray = this.foods.map(async (foodObject) => {
  //   for (let i = 0; i < foodObject.length; i++) {
  //     const numFoodAction = foodObject[i].actionLabel;
  //     if (numFoodAction === 'enter') {
  //       alert ('Enter!');
  //     } else if (numFoodAction === 'tab') {
  //       alert('tab!');
  //     }
  //   }
  // });
  // const numberOfFoods = await Promise.all(foodsPromiseArray);
  // alert(numberOfFoods);
  // alert('End');
  // };

  // getFoodArray =
  // async() => {
  // console.log(await this.makingFood(1000, 'apricot'));
  // console.log(await this.makingFood(50, 'apple'));
  // const foodTimeArray = [
  //   { ms: 1000, food: 'a', count: 2 },
  //   { ms: 50, food: 'b', count: 1 },
  //   { ms: 500, food: 'c', count: 3 },
  // ];

  // for (let i = 0; i < foodTimeArray.length; i++) {
  //   void this.makingFood(foodTimeArray[i].ms, foodTimeArray[i].food);
  // }

  // const foodMap = foodTimeArray.map(({ ms, food }) => {
  //   return this.makingFood(ms, food);
  // });

  // console.log('before the promise');
  // for (const i of foodTimeArray) {
  //   const j = 0;
  //   while (j < i.count) {
  //     await this.makingFood(i.ms, i.food);
  //     j++;
  //   }
  // }

  // await Promise.all();
  // console.log('after the promise');
  // };

  render() {
    // console.log(this.makingFood(1000, 'apricot'));
    // console.log(this.makingFood(50, 'apple'));
    // void this.getFoodArray();

    return null;
    // <>
    //   <div className="page" style={{ width: 5000, height: 5000, backgroundColor: 'yellow' }}>
    //     <div id="root" style={{ backgroundColor: 'blueviolet' }}>
    //       {/* <div>{this.foods.map(({ label }) => this.getNumberOfFood(label))}</div> */}
    //       {/* <div>{alert(this.makingFood(50000).then(this.getFoodsArrayAction(this.foodsAsAnArray)))}</div> */}
    //       {/* <div>{alert(this.getNumberOfFoodArray())}</div> */}
    //       {/* <div>{alert(this.getAsyncNumberOfFoodArray())}</div> */}
    //       <div>{this.makingFood(50)}</div>
    //     </div>
    //   </div>
    // </>
  }
}
