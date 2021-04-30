export = RecordUpdater;
declare class RecordUpdater {
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query: any);
    priority(value: any): import("./record-updater");
    ignoreDuplicates(): import("./record-updater");
    /**
     * Sets the UPDATE database + table.
     * @param {string} database
     * @param {string} table
     * @returns {RecordUpdater}
     */
    update(database: string, table: string): RecordUpdater;
    /**
     * Sets the SET statement for a specific column.
     * @param {string} column
     * @param {*} value
     * @returns {RecordUpdater}
     */
    set(column: string, value: any): RecordUpdater;
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {RecordUpdater}
     */
    where(...args: Array<string | any | any>): RecordUpdater;
    /**
     * Translates the RecordUpdater to its SQL representation.
     * @returns {Promise<string[]>}
     * @throws {stolen_sbolen_sb.Error} If no UPDATE database/table have been provided.
     * @throws {stolen_sbolen_sb.Error} If no SET columns have been provided.
     */
    toSQL(): Promise<string[]>;
    /**
     * Runs the UPDATE SQL query and returns the status object.
     * @returns {Object}
     */
    fetch(): Object;
    #private;
}
