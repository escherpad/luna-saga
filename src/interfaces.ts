/** Created by ge on 12/6/15. */
import {Action, Thunk} from "luna";
import {Subject, ReplaySubject} from "rxjs/Rx";

export interface TSaga<T> extends Subject<T> {
    replay$:ReplaySubject<T>;
    thunk$:Subject<Thunk>;
    action$:Subject<Action>;
}
