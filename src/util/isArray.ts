/** Created by ge on 3/27/16. */
export function isArray(obj: any): boolean {
    return (typeof obj === "object" && typeof obj.length !== "undefined");
}
