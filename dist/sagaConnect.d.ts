import { Store } from "luna";
import Saga from "./Saga";
export declare function sagaConnect<TState>(store$: Store<TState>, iterator: Iterator<any>, immediate?: boolean): Saga<TState>;
