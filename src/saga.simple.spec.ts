/** Created by ge on 3/27/16. */
/** Created by ge on 3/27/16. */
import {isPromise} from "rxjs/util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {ReplaySubject} from "rxjs/Rx";
import {Saga} from "./Saga";
import {Action} from "luna";
interface TestAction extends Action {
    payload?:any;
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
describe("generator syntax", function () {
    it("process runner should work", function (done:()=>void) {
        function thunk():()=>Action {
            return () => {
                return {type: "DEC"};
            }
        }

        function* idMaker():Iterator<any> {
            yield 0;
            yield;
            yield {type: "INC"};
            // you can bypass the action detection
            yield {type: "INC", __isNotAction: true};
            yield thunk();
            //var result = yield Promise.resolve(1);
            //console.log('======================');
            //expect(result).toBe(1);
            var i:number = 0;
            var j:number;
            while (i <= 6000) {
                j = yield i as number;
                expect(i).toBe(j);
                i++
            }
        }

        let saga = new Saga<TestAction>(idMaker);
        let startDate = Date.now();
        saga.log$.subscribe(
            (_:any)=>console.log("log: ", _),
            (err)=>console.log("saga error: ", err),
            ()=>{
                console.log(`saga execution took ${(Date.now() - startDate)/1000} seconds`);
                done()
            }
        );
        saga.action$.subscribe((_:any)=>console.log("action: ", _));
        saga.thunk$.subscribe((_:any)=>console.log("thunk: ", _));
        saga.run();
    });
});


