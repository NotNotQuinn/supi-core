export = sbError;
declare class sbError extends Error {
    /**
     * Custom error object - has arguments provided
     * @param {Object} obj
     * @param {sbError} [error]
     */
    constructor(obj: Object, error?: sbErorr | undefined);
    parentError: sbError | null;
    date: any;
    toString(): any;
}
