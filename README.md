# Luna-Saga, Write Business Logic As Generators for Reactive Redux Store [Luna](https://github.com/escherpad/luna)

[![Join the chat at https://gitter.im/escherpad/luna](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/escherpad/luna?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Luna-saga is a saga runner built for Luna, a reactive redux implementation based on the Reactive-Extension (Rxjs@v5.0-beta) and build with Typescript. It enhances Rxjs's existing handling operators for Es6 generators by adding support for store `Actions` and a collection of flow management helpers. 

**In English: luna-saga allows you to write all of your business logic synchronously using generators. It is awesome, easier than reactive-thunks, and cleaner than stateful thunk.**

**get started:** run `npm install luna-saga --save` *after* you install `luna` with `npm install luna --save`

## For Angular2 Developers Out There~

`luna-saga` is written in TypeScript with Angular2 in mind. You can directly import it to your ng2 project. To use angular's dependency injection, you can write a simple provider. Personally I prefer to keep things uncoupled from the framework as much as possible, this is why `luna-saga` is written with Angular2 in mind but does not depend on it.

## Wanna use ES6 Generators to build Sagas in your project, but also want to use rxjs?

Luna-saga is the reactive operator for Luna.

The most innovative part of `redux-saga` is the coherent use of es6 generator patterns for thread management, and a powerful suite of flow management utility helper functions. To a certain extent, if you are using Luna with rxjs, you can already use the `Rxjs.spawn` (**not available in Rxjs@5.0-beta**, see [here](https://github.com/ReactiveX/rxjs/issues/1497)) or `Rxjs.from` operator to interface with your saga (generators). Below is an example:

Note that `from` returns all of the yielded results but does not handle Thunk and Promises well. 
Meanwhile `spawn` returns the returned value at the end but it handles yield promise and thunk expressions properly.

```javascript
var Rx = require('rx');

var thunk = function (val) {
  return function (cb) {
    cb(null, val);
  };
};

var saga = Rx.Observable.spawn(function* () {
  var v = yield thunk(12);
  var w = yield [24];
  var x = yield Rx.Observable.just(42);
  var z = yield Promise.resolve(78);
  return v + w[0] + x + y + z;
});

spawned.subscribe(
  function (x) { console.log('next %s', x); },
  function (e) { console.log('error %s', e); },
  function () { console.log('completed'); }
);

// => next 212
// => completed

```

references: 
- [Rxjs.spawn](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/spawn.md)
- [Rxjs: Get Started with Generators](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/generators.md)
- [Rxjs.from](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/from.md)

### Luna-Saga is an enhanced Reactive Process Manager for Generators (to 1st order)

You can do: 

```typescript
import {Saga} from "luna-saga";
function thunk():()=>Action {
    return () => {
        return {type: "DEC"};
    }
}

function* idMaker():Iterator<any> {
    yield 0;                                  // 0
    yield;                                    // undefined
    yield {type: "INC"};                      // this is an action
    yield {type: "INC", __isNotAction: true}; // you can bypass the action detection
    yield thunk();                            // action
    var result = yield Promise.resolve(1);
    expect(result).toBe(1);                   // 1
    var i:number = 0, j:number;
    while (i <= 3) {
        j = yield i as number;                // 0, 1, 2, 3
        expect(i).toBe(j);
        i++
    }
    return "returned value is logged but not evaluated.";
}

let saga = new Saga<TestAction>(idMaker);
let startDate = Date.now();
saga.log$.subscribe(
    (_:any)=>console.log("log: ", _),
    (err)=>console.log("saga error: ", err),
    ()=> {
        console.log(`saga execution took ${(Date.now() - startDate) / 1000} seconds`);
        done()
    }
);
saga.action$.subscribe((_:any)=>console.log("action: ", _));
saga.thunk$.subscribe((_:any)=>console.log("thunk: ", _));
saga.run();

// 'log: ', 0
// 'log: ', undefined
// 'log: ', Object{type: 'INC'}
// 'action: ', Object{type: 'INC'}
// 'log: ', Object{type: 'INC', __isNotAction: true}
// 'log: ', () => { ... }
// 'thunk: ', () => { ... }
// 'log: ', Promise{}
// 'log: ', 0
// 'log: ', 1
// 'log: ', 2
// 'log: ', 3
// 'log: ', 'returned value is logged but not evaluated.'
// 'saga execution took 0.005 seconds'
```


## So this is awesome, what's next?

The next thing to do is to build a set of process helpers, side-effects and flow-control helpers. I'm implementing this following `redux-saga` fantastic API documentation [here](http://yelouafi.github.io/redux-saga/docs/api/index.html).


## Installing Luna-Saga

You can install from npm: `npm install luna-saga`, or from github
```shell
npm install luna-saga@git+https://git@github.com/escherpad/luna-saga.git 
```

### To hook up `saga$` to your luna `store$`, just do:

```javascript
// processGenerator is your generator
// Don't forget to `run` it!
let saga = new Saga(processGenerator).run();

// store$ is your luna rxjs store
store$.update$.subscribe(saga)

saga.action$.subscribe((action:TestAction)=>store$.dispatch(action));
saga.thunk$.subscribe((thunk:Thunk)=>store$.dispatch(thunk));
```

## The Instance

Calling `new Saga(processGenerator)` returns a `saga` instance. Luna `saga` instance is inhereted from Rxjs.Subject.

The `saga.log$` is a (Publish) Subject for all of the yielded expressions from the generator. 

- if yielded expression is a simple object, the object is logged.
- if yielded expression is an action, the object is logged and pushed to `.action$`.
- if yielded expression is an action but with `__isNotAction` flag, it is logged but not pushed to `.action$`
- if yielded expression is a Promise, it is logged
- The return value of the generator is logged but not evaluated.

The `saga.update$` is a ReplaySubject with a buffer size of 1. This means that you can always get the current value of the `store$` state by quering `saga.update$.getValue()`. Subscribing to `saga.update$` results in a `{state, action}` data on subscription. 

The `saga.action$` is a (Publish) Subject for out-going actions that you are gonna dispatch back to the store. It does not have the `getValue()` method.

The `saga.thunk$` is a (Publish) Subject for out-going thunks that you are gonna dispatch back to the store. It also does not have the `getValue()` method.


## Todo (and Progress):

1. [x] generator spawning and test => `new Saga(proc)`
2. [x] ==NEW!== double yield syntax for standard "error-first" callback function.
2. [x] `take` effect
3. [x] `dispatch` (replace name `put`) effect 
3. [x] `call` effect 
3. [x] `apply` effect (`call` alias)
3. [x] `select` effect 
4. [ ] `takeEvery` helper
5. [ ] `takeLast` helper
6. [ ] ... many other effects
7. [ ] `race` flow controller
8. [ ] `parallel` flow controller


## Saga Helpers, Effects, and Flow helpers (Updated Below!)

These special functions are implemented following the API documentasion of `redux-saga`. You can look at the details [here](http://yelouafi.github.io/redux-saga/docs/api/index.html). Below is the documentation for `luna-saga`.

### Saga Effects: `callback`, `take`, `put`, `call`, `apply`, `cps`, `fork`, `join`, `cancel`, `select`

Effect is short for **side-effect**. `luna-saga`'s effect collection allows you to write things synchronously while keeping the generators pure. These side-effect functions merely produce a side-effect object, which is then processed by `saga` internally to do the correct thing.

Below is the test for `luna-saga`. You can look at what is happening here to understand how they work.

```typescript
function* idMaker():Iterator<any> {
    let update:any;
    
    `take` halts the action and wait for an action of particular type.
    update = yield take("INC");
    expect(update).toEqual({state: {number: 1}, action: {type: "INC"}});
    
    // it can be a NOOP action with note state update.
    update = yield dispatch({type: "NOOP"});
    expect(update).toEqual({state: {number: 1}, action: {type: "NOOP"}});
    
    // it can execute a function
    update = yield call(()=> "returned value");
    expect(update).toEqual("returned value");
    
    // it can execute a function with a particular context (for `this`)
    update = yield call([{color: "red"}, function (flower:any) {
        return `${flower} is ${this.color}`
    }], "rose");
    expect(update).toBe('rose is red');
    
    // `apply` is an alias for call with a different signature
    update = yield apply({color: "blue"}, function (thing:any) {
        return `${thing} is ${this.color}`
    }, "sky");
    expect(update).toBe('sky is blue');
    
    // you can query the store state with `select`.
    let state:any;
    state = yield select();
    expect(state).toEqual({number: 1});
    state = yield select("number");
    expect(state).toBe(1);
    
    // we end the test here.
    yield done;
}
```

#### **NEW!!** NodeJs "Error-first" Callback Function with Yield-Yield syntax!

Have you ever wanted to use the `node.js` kind of "error first" callback syntax to write your code? With `luna-saga`, you can. Below is what happens when you run a simple generator in node and pass `yield "something"` in place of the actual callback function:

```javascript
let asyncFn = (cb) => {
    cb("[async result]");
    return "==> asyncFn return <==";
};

function* gen() {
    result = yield asyncFn(yield "please give me callback"); // this is where you ask for a callback function.
    expect(result).toBe("[async result]");
}

// now let's run this!!!
let it = gen();

let result = it.next(); // yield the first yield inside the async function
expect(result.value).toBe('please give me callback');

let callbackResult;
result = it.next((res)=>{callbackResult = res;});// now pass in the callback function
result = it.next(callbackResult); // now yield the second yield, and this is where we return the callback result
expect(result.done).toBe(true);
```

To use this syntax, just import `callback` token from `luna-saga`. It will generate a `@@luna-saga/CALLBACK` type object, and get intercepted by the `luna-saga` effect executer.

```javascript
import {callback} from "luna-saga";

function* authenticationProcess() {
    try {
        user = yield mongo.findOne({username: "Ge Yang"}).exec(yield callback);
    } catch (error) {
        console.log(error);
    }
```
isn't this fantastic?


#### `take(ACTION_TYPE) yield {state, action}`

say in your generator you want to pause the process untill the process recieves a certain action. You can write: 

```javascript
let update = yield take("your_action_type");
// update = {state: <your current state>, action: <the action for that state>}
```

#### `dispatch(action) yield {state, action}` (`put` in redux-saga)

use this to dispatch an action. This function does not support thunk at the moment. 

```javascript
let update = yield dispatch(<your_action_>);
// update = {state: <your state>, action: <action>}
```

#### `call(fn[, args]) yield <return from fn>`, `call([context, fn][, args])` and `apply(context, fn[, args])`

I didn't really see a huge need for these but I implemented them anyways. You can yield functions directly without using side effect. However these are useful when you want to run object methods.

#### `select([selector:string]) return <selected part of state>`

returns a selected part of the store state. If selector is undefined, select returns the entire store state.

```javascript
let data = yield select() // <entire store>
let data = yield select("number") // 1
```

## Developing Luna-Saga

- you need to have `karma-cli` installed globally. (do `npm install -g karma-cli`)
- to build, run `npm run build`. This just calls `tsc` in project root.
- to test, you can use `karma start`. I use webStorm's karma integration to run the tests.

Work In Progress Below This Line
----
### Saga Helpers: `takeLast` and `takeEvery`

These are the high-level helpers to spawn sagas processes from within a saga. `takeEvery` and `takeLast` are similar to the `rxjs.takeEvery` and `rxjs.takeLast`

### Flow helpers: `race(effects)` and `parallel([...effects])`

Allows one to pick the result of a winner, or run a few effects in parallel. 

## Acknowledgement

This library is inspired by @yelouafi's work on redux-saga.

Luna-saga is part of my effort on re-writting [escherpad](http://www.escherpad.com), a beautiful real-time collaborative notebook supporting real-time LaTeX, collaborative Jupyter notebook, and a WYSIWYG rich-text editor.

## About Ge

I'm a graduate student studying quantum information and quantum computer at University of Chicago. When I'm not tolling away in a cleanroom or working on experiments, I write `(java|type)script` to relax. You can find my publications here: [google scholar](https://scholar.google.com/citations?user=vaQcF6kAAAAJ&hl=en)

## LICENSING

MIT.
