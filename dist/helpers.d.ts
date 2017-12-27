export declare function delay(ms: number): Promise<any>;
/** throttle process: Takes in a task function, a trigger object <RegExp, string, TSym>, input interval, and flag for triggering on falling edge. */
export declare function throttle(task: Function, trigger: void | any, interval?: number, falling?: boolean): Generator;
