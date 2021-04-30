export = Error;
declare class Error extends Error {
    /**
     * Custom error object - has arguments provided
     * @param {Object} obj
     * @param {Error} [error]
     */
    constructor(obj: Object, error?: import("./error") | undefined);
    parentError: import("./error") | null;
    date: any;
    toString(): any;
}
