
<h1 align="center">Chrome Service :man_firefighter:</h1>

<div align="center">
  🚅:train::train::train:
</div>
<div align="center">
  <strong>Is Part of CoreStart</strong>
</div>
<div align="center">
  Allows plugins to customize the global-header UI
</div>

<br>


- [About!](#about-)
- [Nav Controls Service](#navcontrolsservice-)
- [Nav Links Service](#navlinksservice-)
- [Recently Accessed Service](#recentlyaccessedservice-)
- [Doc Title Service](#doctitleservice-)
- [UI](#ui-)
- [Custom React Hooks](#custom-react-hooks-)
- [Common RX Js Terms and Operator](#common-rx-js-terms-and-operator-)


## About :
- <b> Signature </b> - ```export interface ChromeStart```
- <b> CoreStart</b> - Core services exposed to the Plugin start lifecycle.
- <b> How to access ? </b>  add in interface ```chrome: ChromeStart && chrome.servicesName => e.g chrome.docTitle.method```
- <b> Where it is getting Registered/Executed </b> [Staring Point](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/public/rendering/rendering_service.tsx)
- <b> How header component is getting rendered </b> ``` const chromeUi = chrome.getHeaderComponent(); ```
- <b> Chrome Methods </b> [See chrome interface/methods](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/53e98a66a81cf986894962b5f17e4190baebf57f/src/core/public/chrome/chrome_service.tsx)
- <b> Consists of these sub-services/components </b> : 
```js
- NavControlsService : for registering new controls to be displayed in the navigation bar.
- NavLinksService : for manipulating nav links.
- RecentlyAccessedService : for recently accessed history.
- DocTitleService: for accessing and updating the document title
- UI : All the UI components,icons for e.g  header, loaders.
```
### NavControlsService : 
- Interface : ChromeNavControls
- Signature : ```navControls: ChromeNavControls```
- Registering new controller 

Example : 
Register a left-side nav control rendered with React.

```jsx
chrome.navControls.registerLeft({
  mount(targetDomElement) {
    ReactDOM.mount(<MyControl />, targetDomElement);
    return () => ReactDOM.unmountComponentAtNode(targetDomElement);
  }
})
```
### NavLinksService : 
- Interface :  ChromeNavLinks
- Signature : ```navLinks: ChromeNavLinks```
- e.g Method : 

```typescript
Get an observable for a sorted list of navlinks :-
getNavLinks$(): Observable<Array<Readonly<ChromeNavLink>>>;

Get the state of a navlink at this point in time :-
get(id: string): ChromeNavLink | undefined;

Get the current state of all navlinks :-
getAll(): Array<Readonly<ChromeNavLink>>;

Check whether or not a navlink exists :-
has(id: string): boolean;

Remove all navlinks except the one matching the given id :-
showOnly(id: string): void;
```
- How to access
  ###### Get the current state of all navlinks: 
  ```ts
  core.chrome.navLinks.getAll() 
  ```

  ###### Get the state of a navlink at this point in time: 
  ```ts
  core.chrome.navLinks.get()
  ```

### RecentlyAccessedService : 

- Interface : ChromeRecentlyAccessed
- Signature : ```recentlyAccessed: ChromeRecentlyAccessed```
- The Recently viewed items are stored in the browser's local storage.
- You can go back to the recent search/visualization/dashboard , each item has (link,label,id)
- Methods :

```typescript

Adds a new item to the recently accessed history :-
add(link: string, label: string, id: string): void;
 
Gets an Array of the current recently accessed history :-
get(): ChromeRecentlyAccessedHistoryItem[];

Gets an Observable of the array of recently accessed history :-
get$(): Observable<ChromeRecentlyAccessedHistoryItem[]>; 
```
- How to access
   ###### Adds a new item to the recently accessed history :
   ```ts
   chrome.recentlyAccessed.add('/app/map/1234', 'Map 1234', '1234');
   ```
   ###### Gets an Array of the current recently accessed history :
   ```ts
    chrome.recentlyAccessed.get().forEach(console.log);;
   ```
   
### DocTitleService : 
- Interface : ChromeDocTitle
- Signature : ```docTitle: ChromeDocTitle```
  ###### - How to change the title of the document


   ```ts
   chrome.docTitle.change('My application title')
   chrome.docTitle.change(['My application', 'My section'])
   ```
### UI :
###### consists of tsx/scss files && renders UI components from css Library e.g ```<Progress props={props}>```

- Adding/overriding existing css : e.g.
  ```jsx
      - Create scss file and define class e.g .osdCustomClass{}
      - pass className prop to UI component.
        e.g <HeaderBreadcrumbs className="osdCustomClass"/>;
  ```
- UI Components :
  - HeaderBreadcrumbs : Props
       ```ts
       - responsive:boolean Hides extra (above the max) breadcrumbs under a collapsed item as the window gets smaller.
       
       - truncate: boolean Forces all breadcrumbs to single line and truncates each breadcrumb to a particular width, except for the last item
       
	   - max : Collapses the inner items past the maximum set here into a single ellipses item.
	   
	   - breadcrumbs : The array of individual Breadcrumb items
       ```
### Custom React Hooks :
<b> useObservable</b> : React state hook that tracks the latest value of an Observable.
[More About "React-use" custom hooks library](https://github.com/streamich/react-use)


### Common RX Js Terms and Operator : 
#### Observable :  
Understand callbacks and promises before diving into observables!
Callback functions (as their name suggests) are called at the back and promises are objects that promise they will have value in the near future - either a success or failure. Observables are also like callbacks and promise and can be defined as function that can return a stream of values to an observer over time, this can either be synchronously or asynchronously.

- Observables handle multiple values unlike promises
- Observables are cancelable.

###### Observable: :telescope:
Observable is for the consumer, it can be transformed and subscribed.
```js
observable.map(x => ...).filter(x => ...).subscribe(x => ...) 
```
###### Observer: :microscope:
Observer is the interface which is used to feed an observable source
```js
observer.error("error")
observer.next(2)
observer.complete("complete")
```
four stages through which observables pass. They are:

- Creation ``` Observable.create ```
- Subscription ``` Observable.subscribe ```
- Execution part of obersrver ``` observer.next ``` ```observer.error``` ```observer.complete```  
- Destruction ```unsubscribe()```

### Subject : :books:

Special type of Observable that allows values to be multicasted to many Observers and can be used to implement both the Observable and the Observer interfaces:

```js
var source = new Subject();
source.map(x => ...).filter(x => ...).subscribe(x => ...)
source.next('1')
source.next('2')
````

<b>BehaviorSubject </b>: Is a type of subject, a subject is a special type of observable so you can subscribe to messages like any other observable.
```js
import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject(123);

// new subscribers will get initial value => output: 123, 123
subject.subscribe(console.log);
// two subscribers will get new value => output: 456, 456
subject.next(456);

// new subscriber will get latest value (456) => output: 456
subject.subscribe(console.log);
```
<b> ReplaySubject </b>: its similar like BehaviorSubject and can emits n no of values ReplaySubject(n)

```js
// RxJS
import { ReplaySubject } from 'rxjs';

const sub = new ReplaySubject(3);

sub.next(1);
sub.next(2);
sub.subscribe(console.log); // OUTPUT => 1,2
sub.next(3); // OUTPUT => 3
sub.next(4); // OUTPUT => 4
sub.subscribe(console.log); // OUTPUT => 2,3,4 (log of last 3 values from new subscriber)
sub.next(5); // OUTPUT => 5,5 (log from both subscribers)
```
### Rx Operators : :stethoscope:

<b> first </b> : Emits only the first value (or the first value that meets some condition) emitted by the source Observable.

<b>map</b>: Transform the items emitted by an Observable by applying a function to each item

<b>takeUntil </b>: Emits the values of the source observable until another observable emits a value

<b>filter</b>: Filters an Observable by only allowing items through that pass a test that you specify in the form of a predicate function

<b>tap </b>: Returns an observable output that is identical to the source observable but performs a side effect for every emission on the source observable

<b>scan </b>: It's like array reduce, but emits the current accumulation whenever the source emits a value.

<b>take </b>: A function that returns an Observable that emits only the first count values emitted by the source Observable, or all of the values from the source if the source emits fewer than count values

<b>skip</b>: Used when you have an observable that always emits certain values on subscription that you wish to ignore

<b>switchMap </b>:  A function that returns an Observable that emits the result of applying the projection function to each item emitted by the source Observable and taking only the values from the most recently projected inner Observable.

<b>pipe </b> : Is both a standalone function and a method on the Observable interface that can be used to combine multiple RxJS operators to compose asynchronous operations.

### Loadash : :truck:
JavaScript library which provides utility functions

<b> sortBy </b> : creates an array of elements which is sorted in ascending order.

<b> orderBy </b> : similar to sortBy() method except that it allows the sort orders of the iterates to sort by.

<b> isEqual </b> : performs a deep comparison between two values to determine if they are equivalent. This method supports comparing arrays, array buffers, boolean, date objects, maps, numbers, objects, regex, sets, strings, symbols, and typed arrays. 

<b> cloneDeep</b> : used to clone value in a recursive way

<b> flattenDeep </b> : used to clone value in a recursive way

<b> has </b> : used to check whether the path is a direct property of object or not. It returns true if path exists, else it returns false.

<b> isString  </b> : used to find whether the given value is a string object or not

<b> compact </b> : used to creates an array with all falsey values removed 

<b> _ </b> :  Import the Whole Lodash Library

### Learn More About Libraries :

[Rx js](https://rxjs.dev/guide/overview)

[Rx Operators](https://rxjs.dev/guide/operators)

[Loadsh](https://lodash.com/)

[React-Use](https://github.com/streamich/react-use)

[TypeScript](https://www.typescriptlang.org/)
