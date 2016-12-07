import { Saga } from "./Saga";
import { Store } from "luna";
declare function sagaConnect<TState>(store$: Store<TState>, generator: () => Iterator<any>, immediate?: boolean): Saga<TState>;
export default sagaConnect;
