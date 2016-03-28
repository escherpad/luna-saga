/** Created by ge on 12/6/15. */
export interface TSaga<TState, TAction> {
    state: TState;
    action: TAction;
}
