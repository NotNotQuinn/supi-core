export = RecordDeleter;
declare class RecordDeleter {
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query: any);
    /**
     * Placeholder for the "correct" SQL syntax
     * @returns {RecordDeleter}
     */
    delete(): RecordDeleter;
    /**
     * Creates a FROM statement for DELETE
     * @param {string} database
     * @param {string} table
     * @returns {RecordDeleter}
     */
    from(database: string, table: string): RecordDeleter;
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {RecordDeleter}
     */
    where(...args: Array<string | any | any>): RecordDeleter;
    /**
     * If there is a need to delete without WHERE, this flag must be set.
     * Otherwise, a no-condition DELETE will not be performed, and ends with an exception.
     * @returns {RecordDeleter}
     * @throws {stolen_sb.Error} If no FROM database/table have been provided.
     */
    confirm(): RecordDeleter;
    /**
     * Translates the RecordDeleter to its SQL representation.
     * @returns {Promise<string[]>}
     * @throws {stolen_sb.Error} If no FROM database/table have been provided.
     */
    toSQL(): Promise<string[]>;
    /**
     * Runs the UPDATE SQL query and returns the status object.
     * @returns {Object}
     */
    fetch(): Object;
    #private;
}
