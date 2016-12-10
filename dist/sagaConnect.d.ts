/** Created by ge on 12/6/16. */
import { Store } from "luna";
import Saga from "./Saga";
import { TSym } from "./util/Sym";
export declare const SAGA_CONNECT_ACTION: TSym;
export declare function sagaConnect<TState>(store$: Store<TState>, generator: () => Iterator<any>, immediate?: boolean): Saga<TState>;
