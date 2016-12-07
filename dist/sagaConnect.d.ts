import Saga from "./Saga";
import { Store } from "luna";
export declare function sagaConnect<TState>(store$: Store<TState>, generator: () => Iterator<any>, immediate?: boolean): Saga<TState>;
