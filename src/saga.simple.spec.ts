/** Created by ge on 3/27/16. */
/** Created by ge on 3/27/16. */
import {isPromise} from "rxjs/util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {Subject} from "rxjs";
import Saga from "./Saga";
import {Action} from "luna";
import {CALLBACK} from "./util/isCallback";
interface TestAction extends Action {
    payload?:any;
}

describe("saga.simple.spec: Promise Handling", function () {
    it("process runner should work", function (done:()=>void) {
        function Thunk():()=>Action {
            return () => {
                return {type: "DEC"};
            }
        }

        function dummyAsyncFunc (cb:(err:any, res?:any)=>void) {
            cb(null, "** async RESULT **");
        }

        function dummyAsyncFuncThrowingError (cb:(err:any, res?:any)=>void) {
            cb("** async ERROR **");
        }

        function* idMaker():Iterator<any> {
            // you can yield number
            yield 0;

            // you can yield undefined
            yield;

            // you can yield action
            yield {type: "INC"};
            // and you can bypass the action detection
            yield {type: "INC", __isNotAction: true};

            // you can yield Thunk (the returned Thunk of it)
            let result = yield Thunk();
            expect(typeof result).toBe('function');

            // **advanced**
            // you can use the yield-yield syntax with the CALLBACK token
            // Here the middleware intercepts the callback token, returns
            // a callback function into the generator, which allows
            // the async function to execute (the `dummyAsyncFunc`)
            result = yield dummyAsyncFunc(yield CALLBACK);
            expect(result).toBe("** async RESULT **");

            // we can catch error synchronously in the callback
            try {
                result = yield dummyAsyncFuncThrowingError(yield CALLBACK);
            } catch (err) {
                expect(err).toBe("** async ERROR **");
            }

            result = yield Promise.resolve(1);
            expect(result).toBe(1);
            var i:number = 0, j:number;
            while (i <= 3) {
                j = yield i as number;
                expect(i).toBe(j);
                i++
            }
            return "returned value is logged but not evaluated.";
        }

        let saga = new Saga<TestAction>(idMaker());
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
        saga.thunk$.subscribe((_:any)=>console.log("Thunk: ", _));
        saga.run();
    });
});


