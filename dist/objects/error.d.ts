import sbDate from './date';
export default class sbError extends global.Error {
    parentError: sbError | Error | null;
    date: sbDate;
    /**
     * Custom error object - has arguments provided
     * @param {Object} obj
     * @param {Error} [error]
     */
    constructor(obj: object, error?: Error);
    toString(): any;
}
