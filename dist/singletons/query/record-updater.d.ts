import Query from './index';
import { WhereHavingParams, FormatSymbol } from './index';
/**
 * Represents the UPDATE sql statement.
 */
export default class RecordUpdater {
    #private;
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query: Query);
    priority(value: "normal" | "low"): this;
    ignoreDuplicates(): this;
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
    where(...args: Array<string | FormatSymbol | WhereHavingParams>): RecordUpdater;
    /**
     * Translates the RecordUpdater to its SQL representation.
     * @returns {Promise<string[]>}
     * @throws {sbError} If no UPDATE database/table have been provided.
     * @throws {sbError} If no SET columns have been provided.
     */
    toSQL(): Promise<string[]>;
    fetch(): Promise<any>;
}
