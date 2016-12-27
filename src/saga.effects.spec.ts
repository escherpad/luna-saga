/** Created by ge on 3/27/16. */
import Saga from "./Saga";
import {Action} from "luna";
import {take, dispatch, call, apply, select} from "./effects/effectsHelpers";
import {Observable} from "rxjs/Observable";
import {queue} from "rxjs/scheduler/queue";
import {Store} from "luna/dist/index";
import {Reducer} from "luna/dist/index";
import {delay} from "./helpers";
import {SAGA_CONNECT_ACTION} from "./Saga";
import {isAction} from "./util/isAction";

interface TestState {
    number?: number;
}
interface TestAction extends Action {
    payload?: any;
}

describe("saga.effects.spec", function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 550;
    it("take effect allow yield on a certain type of actions", function (done: () => void) {

        function thunk(): () => Action {
            return () => {
                return {type: "DEC"};
            }
        }

        function* idMaker(): Iterator<any> {
            let update: any;
            update = yield take("INC");
            console.log('1 *****', update);
            expect(update).toEqual({state: {number: 1}, action: {type: "INC"}});
            // can test NOOP actions without getting hangup
            update = yield dispatch({type: "NOOP"});
            console.log('2 *****', update);
            expect(update).toEqual({state: {number: 1}, action: {type: "NOOP"}});
            update = yield call(() => "returned value");
            console.log('3 *****', update);
            // now delay:
            yield call(delay, 500);
            expect(update).toEqual("returned value");
            update = yield call([{color: "red"}, function (flower: any) {
                return `${flower} is ${this.color}`
            }], "rose");
            expect(update).toBe('rose is red');
            update = yield apply({color: "blue"}, function (thing: any) {
                return `${thing} is ${this.color}`
            }, "sky");
            expect(update).toBe('sky is blue');
            let state: any;
            state = yield select();
            expect(state).toEqual({number: 1});
            state = yield select("number");
            expect(state).toBe(1);
            yield done;
        }

        let saga = new Saga<TestState>(idMaker());
        let testActions = [
            {type: "INIT_STORE"},
            {type: "INC"},
            {type: "random"},
            {type: "another random action"},
            {type: "NOOP"}
        ];
        // building the test store
        let counterReducer = <Reducer>function <Number>(state: number = 0, action: TestAction): number {
            if (action.type === "INC") {
                return state + 1;
            } else if (action.type === "DEC") {
                return state - 1;
            } else {
                return state;
            }
        };
        let store$ = new Store({number: counterReducer});
        // subscribe the saga to the store (state,action) bundle
        store$.update$.subscribe(saga);
        saga.action$.subscribe((action: any) => {
            console.log("action: ", action);
            if (!isAction(action)) throw console.error("action is ill defined", action);
            store$.dispatch(action);
        });
        saga.thunk$.subscribe((_: any) => {
            console.log("thunk: ", _);
            store$.dispatch(_);
        });
        saga.log$.subscribe(
            (_: any) => console.log("log: ", _),
            (err: any) => console.log("saga error: ", err)
        );
        /* run saga before subscription to states$ in this synchronous case. */
        saga.run();

        store$.dispatch(testActions[0]);
        store$.dispatch(testActions[1]);
        store$.dispatch(testActions[2]);
        store$.dispatch(testActions[3]);
        store$.dispatch(testActions[4]);
        store$.dispatch(testActions[4]);
    });

    it("test select effect corner cases", function (done: () => void) {

        function* idMaker(): Iterator<any> {
            let numberState: any;
            // as long as a synthesized SAGA_CONNECT event is emitted with state value
            // the select effect would have the state already populated in the replay
            // subject. [^reference](./sagaConnect.ts:L19)
            numberState = yield select("number");
            console.log('4 *****', numberState);
            expect(numberState).toEqual(0);
            numberState = yield select("number");
            console.log('5 *****', numberState);
            expect(numberState).toEqual(0);
            numberState = yield select("number");
            console.log('6 *****', numberState);
            expect(numberState).toEqual(0);
            yield done;
        }

        let saga = new Saga<TestState>(idMaker());

        // building the test store
        let counterReducer = <Reducer>function <Number>(state: number = 0, action: TestAction): number {
            if (action.type === "INC") {
                return state + 1;
            } else if (action.type === "DEC") {
                return state - 1;
            } else {
                return state;
            }
        };
        let store$ = new Store({number: counterReducer});
        // subscribe the saga to the store (state,action) bundle
        store$.update$.subscribe(saga);
        saga.action$.subscribe((action: any) => {
            console.log("action: ", action);
            if (!isAction(action)) throw console.error("action is ill defined", action);
            store$.dispatch(action);
        });
        saga.thunk$.subscribe((_: any) => {
            console.log("thunk: ", _);
            store$.dispatch(_);
        });
        saga.log$.subscribe(
            (_: any) => console.log("log: ", _),
            (err: any) => console.log("saga error: ", err)
        );
        /* run saga before subscription to states$ in this synchronous case. */
        saga.run();
        saga.next({state: store$.getValue(), action: {type: SAGA_CONNECT_ACTION}});

    });

    it("generator handling with CALL effect halder", function (done: () => void) {

        function* oneTimeGenerator(): Iterator<any> {
            console.log('executing oneTimeGenerator');
            console.log("call result", yield call((_: any) => console.log('some >>> ', _), "input argument"));
            console.log("call result", yield call(delay, 100));
            yield call(() => console.log('oneTimeGenerator has finished running'));
        }

        function* processStub(): Iterator<any> {
            console.log("test delay >> ", yield call(delay, 100));
            yield call(oneTimeGenerator);
        }

        let saga = new Saga<TestAction>(processStub());
        let startDate = Date.now();
        saga.log$.subscribe(
            (_: any) => console.log("log: ", _),
            (err) => console.log("saga error: ", err),
            () => {
                console.log(`saga execution took ${(Date.now() - startDate) / 1000} seconds`);
                done()
            }
        );
        saga.action$.subscribe((_: any) => console.log("action: ", _));
        saga.thunk$.subscribe((_: any) => console.log("Thunk: ", _));
        saga.run();
    });
});


