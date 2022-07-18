
##    Chrome Service

- [About!](#about-)
- [Nav Controls Service](#navcontrolsservice-)
- [Nav Links Service](#navlinksservice-)
- [Recently Accessed Service](#recentlyaccessedservice-)
- [Doc Title Service](#doctitleservice-)
- [UI](#ui-)

## About :
- **Signature** - `export interface ChromeStart`
The chrome service is a high level UI service that is part of CoreStart (Core services exposed to the Plugin start lifecycle) and offers other plugins a way to add navigation controls to the UI, edit the document title, manipuate navlinks on global header as well as edit the recent accessed tab. It consists of these sub-services/components.

- NavControlsService : for registering new controls to be displayed in the navigation bar.
- NavLinksService : for manipulating nav links.
- RecentlyAccessedService : for recently accessed history.
- DocTitleService: for accessing and updating the document title
- UI : All the UI components,icons e.g.  header, loaders.


- How to access ? add in interface `chrome: ChromeStart && chrome.servicesName => e.g chrome.docTitle.method`
- Where it is getting Registered/Executed ? [Staring Point](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.1/src/core/public/rendering/rendering_service.tsx)
- How header component is getting rendered ? `const chromeUi = chrome.getHeaderComponent(); `
- Chrome Methods </b> [See chrome interface/methods](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.1/src/core/public/chrome/chrome_service.tsx)


### NavControlsService : 
- Interface : ChromeNavControls
- **Signature** - `navControls: ChromeNavControls`
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
- **Signature** - `navLinks: ChromeNavLinks`
- e.g. Method : 

Get an observable for a sorted list of navlinks :-

`getNavLinks$(): Observable<Array<Readonly<ChromeNavLink>>>`

Get the state of a navlink at this point in time :-

`get(id: string): ChromeNavLink | undefined`

Get the current state of all navlinks :-

`getAll(): Array<Readonly<ChromeNavLink>>`

Check whether or not a navlink exists :-

`has(id: string): boolean`

Remove all navlinks except the one matching the given id :-
`showOnly(id: string): void`

- How to access
  ###### Get the current state of all navlinks: 
  `core.chrome.navLinks.getAll()`

  ###### Get the state of a navlink at this point in time: 
  `core.chrome.navLinks.get()`

### RecentlyAccessedService : 

- Interface : ChromeRecentlyAccessed
- Signature : ```recentlyAccessed: ChromeRecentlyAccessed```
- The Recently viewed items are stored in the browser's local storage.
- You can go back to the recent search/visualization/dashboard , each item has (link,label,id)
- Methods :

Adds a new item to the recently accessed history :-

`add(link: string, label: string, id: string): void`
 
Gets an Array of the current recently accessed history :-

`get(): ChromeRecentlyAccessedHistoryItem[]`

Gets an Observable of the array of recently accessed history :-

`get$(): Observable<ChromeRecentlyAccessedHistoryItem[]>`

- How to access
   ###### Adds a new item to the recently accessed history :
   `
   chrome.recentlyAccessed.add('/app/map/1234', 'Map 1234', '1234');
   `
   ###### Gets an Array of the current recently accessed history :
   `
    chrome.recentlyAccessed.get().forEach(console.log);;
   `
   
### DocTitleService : 
- Interface : ChromeDocTitle
- **Signature** - `docTitle: ChromeDocTitle`
  ###### - How to change the title of the document


   ```ts
   chrome.docTitle.change('My application title')
   chrome.docTitle.change(['My application', 'My section'])
   ```
### UI :
###### consists of tsx/scss files && renders UI components from css Library e.g ```<Progress props={props}>```

###### Adding/overriding existing css : 
- Create scss file and define class e.g .osdCustomClass{}
- pass className prop to UI component.
        e.g `<HeaderBreadcrumbs className="osdCustomClass"/> `

###### UI Components :
  - HeaderBreadcrumbs : Props
       
  -  responsive:boolean Hides extra (above the max) breadcrumbs under a collapsed item as the window gets smaller.
  -  max: Collapses the inner items past the maximum set here into a single ellipses item.      
  -  breadcrumbs : The array of individual Breadcrumb items
	
      