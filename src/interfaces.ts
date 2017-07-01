/** Created by ge on 12/6/15. */
import {Action, Thunk} from "luna";
import {ProcessSubject} from "./Saga";

export interface TSaga<T> extends ProcessSubject<T> {
    replay$: ProcessSubject<T>;
    log$: ProcessSubject<any>;
    action$: ProcessSubject<Action>;
    thunk$: ProcessSubject<Thunk>;
    run: () => void;
}
