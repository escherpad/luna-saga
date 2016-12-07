/** Created by ge on 12/6/16. */
import {TSaga} from "./interfaces";
import {Saga} from "./Saga";
import {Store, Thunk, Action} from "luna";

function sagaConnect<TState>(store$: Store<TState>,
                             generator: ()=>Iterator<any>,
                             immediate?: boolean): Saga<TState> {
    let process = new Saga<TState>(generator);
    store$.update$.subscribe(process);
    process.thunk$.subscribe((_t: Thunk) => store$.dispatch(_t));
    process.action$.subscribe((_a: Action) => store$.dispatch(_a));
    if (immediate) process.run();
    return process;
}
export default sagaConnect;
