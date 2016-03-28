# Luna-Saga, A Saga Runner for Reactive Redux Store ([Luna](https://github.com/escherpad/luna))

[![Join the chat at https://gitter.im/escherpad/luna](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/escherpad/luna?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Luna-saga is a saga runner built for Luna, a reactive redux implementation based on the Reactive-Extension (Rxjs@v5.0-beta) and build with Typescript. It enhances Rxjs's existing handling operators for Es6 generators by adding support for store `Actions` and a collection of flow management helpers. 

## Wanna use ES6 Generators to build Sagas in your project, but also want to use rxjs?

Luna-saga is the reactive operator for Luna.

The most innovative part of `redux-saga` is the coherent use of es6 generator patterns for thread management, and a powerful suite of flow management utility helper functions. To a certain extent, if you are using Luna with rxjs, you can already use the `Rxjs.spawn` (not available in Rxjs@5.0-beta, see [here](https://github.com/ReactiveX/rxjs/issues/1497)) or `Rxjs.from` operator to interface with your saga (generators). Below is an example:

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

### So Luna-Saga is an enhanced Rx operator for Generators (to 1st order)

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

#### To hook up `saga$` to your luna `store$`, just do:

```javascript
//... store$ is your luna rxjs store

store$.map(store => {store, action:store.action$.getValue()}).subscribe(saga$)
saga$.action$.subscribe(store$.dispatch)
```

## Saga Helpers, Effects, and Flow helpers

### Saga Helpers: `takeLast` and `takeEvery`

These are the high-level helpers to spawn sagas processes from within a saga. `takeEvery` and `takeLast` are similar to the `rxjs.takeEvery` and `rxjs.takeLast`

### Saga Effects: `take`, `put`, `call`, `apply`, `cps`, `fork`, `join`, `cancel`, `select`

### Flow helpers: `race(effects)` and `parallel([...effects])`

### Middlewares (don't need anymore)

You don't need middleware anymore now you have Rxjs. In Rxjs, an observable is a stream of data that you can subscribe to. In Luna, the `Store` is a subclass of the `Rxjs.BehaviorSubject`, which is an extension of the `Observable` class. In addition, Luna `Store` also has a property called `Store.action$`, which is a `Rx.Subject` for all of the actions the store accepts. In a reactive paradigm, if you want to log all of the actions for instance, you can just subscribe to the `Store.action$` stream.

and I personally find this very powerful!

## For Angular2 Developers Out There~

`luna-saga` is written in TypeScript, so you can just import it directly into your ng2 project. To use angular's dependency injection, you can write a simple provider. Personally I prefer to keep things uncoupled from the framework as much as possible, this is why `luna-saga` is written with Angular2 in mind but does not depend on it.

## Architecture Overview

Luna-saga returns a BehaviorSubject. It emits a stream of state objects that you can subscribe to. 

the `store.action$` is a behavior subject for the actions. The store internally subscribes to this stream and executes the reducers on the store state in response to events from this action stream. 

## Installing Luna

from npm: 
```shell
npm install luna-saga
```

or from github
```shell
npm install luna-saga@git+https://git@github.com/escherpad/luna-saga.git 
```


## Developing Luna

- you need to have `karma-cli` installed globally. (do `npm install -g karma-cli`)
- to build, run `npm run build`. This just calls `tsc` in project root.
- to test, you can use `karma start`. I use webStorm's karma integration to run the tests.

## Plans next

Personally I think documentation is the most important part of a library, and for making everyone's life easier. Bad documentation wastes people's time.

If you would like to help, besides code you can create even larger impact by writing up examples. Redux (and luna) is a simple idea. Let's make it easier for people to understand the concept and start doing things that they set-out to do asap.

### Todo List

- [ ] use immutable in the test instead. Current form is too sloppy!
- [ ] more testing cases with complicated stores
- better store life-cycle support

## Acknowledgement

This library is inspired by @yelouafi's work on redux-saga.

Luna-saga is part of my effort on re-writting [escherpad](http://www.escherpad.com), a beautiful real-time collaborative notebook supporting real-time LaTeX, collaborative Jupyter notebook, and a WYSIWYG rich-text editor.

## About Ge

I'm a graduate student studying quantum information and quantum computer at University of Chicago. When I'm not tolling away in a cleanroom or working on experiments, I write `(java|type)script` to relax. You can find my publications here: [google scholar](https://scholar.google.com/citations?user=vaQcF6kAAAAJ&hl=en)

## LICENSING

MIT.
