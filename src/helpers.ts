/**
 * Created by ge on 12/7/16.
 *
 * Usage Example:
 * yield call(delay, 500)
 *
 * */

export function delay(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms))
}

