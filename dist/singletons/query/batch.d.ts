import Query from './index';
import { ColumnDefinition } from './index';
/**
 * Represents the SQL INSERT statement for multiple rows.
 * One instance is always locked to one table and some of its columns based on constructor.
 */
declare class Batch {
    /**
     * This promise resolves when the Batch finishes constructing.
     */
    readyPromise: Promise<void>;
    query: Query | null;
    database: string | null;
    table: string | null;
    records: any[] | null;
    columns: ColumnDefinition[] | null;
    ready: boolean | null;
    /**
     * Creates a new Batch instance. Constructor must be await-ed.
     * @param {Query} query
     * @param {string} db
     * @param {string} table
     * @param {string[]} columns
     * @throws sbError If a nonexistent column has been provided
     */
    constructor(query: Query, db: string, table: string, columns: string[]);
    /**
     * Adds a data record, based on the Batch's columns definition
     * @param {Object} data
     * @returns {number} The index of added data record
     */
    add(data: object): number;
    /**
     * Deletes a record based on its index
     * @param index
     */
    delete(index: number): void;
    /**
     * Attempts to find a record based on a callback function
     * @param {Function} callback
     * @returns {Object|null} record
     */
    find(callback: NthArgType<0, functionArguments<Array<Object>["find"]>>): object | null;
    /**
     * Executes the INSERT statement for bound database, table and columns.
     * Automatically clears itself after the statement is executed.
     * @param {Object} options Additional options
     * @param {boolean} options.ignore If true, batch will use `INSERT IGNORE INTO`.
     * @param {Function} options.duplicate If set, will use the result of this callback to create ON DUPLICATE KEY clausule.
     * @returns {Promise<void>}
     */
    insert(options?: {
        ignore?: boolean;
        duplicate?: Function;
    }): Promise<void>;
    /**
     * Clears all records from the instance.
     */
    clear(): void;
    /**
     * Destroys the instance, freeing up memory and making it unusable.
     */
    destroy(): void;
}
declare type functionArguments<T extends Function> = T extends (...args: infer A) => any ? A : unknown;
declare type NthArgType<N extends number, A extends Array<any>> = A extends Array<any> ? A[N] : unknown;
export default Batch;
