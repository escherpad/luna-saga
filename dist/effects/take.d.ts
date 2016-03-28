export declare const TAKE: string;
export declare function take(selector: ((selector: string) => boolean | RegExp | string)): {
    type: string;
    selector: (selector: string) => boolean | RegExp | string;
};
