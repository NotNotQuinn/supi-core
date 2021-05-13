import { TableDefinition } from './index';
import Query from "./index";
/**
 * Represents one row of a SQL database table.
 */
declare class Row {
    #private;
    query: Query;
    /**
     * This promise resolves when the Row finishes constructing.
     * @type {Promise<any>}
     */
    readyPromise: Promise<void>;
    /**
     * Creates a new Row instance
     * @param {Query} query
     * @param {string} database
     * @param {string} table
     */
    constructor(query: Query, database: string, table: string);
    /**
     * Loads a row based on its primary key.
     * @param {number} primaryKey
     * @param {boolean} ignoreError
     * @returns {Promise<Row>}
     */
    load(primaryKey: number, ignoreError?: boolean): Promise<Row>;
    /**
     * Saves the row.
     * If a primary key is present, saves the row as new (INSERT).
     * If not, saves an existing row (UPDATE).
     * @param {Object} options
     * @param {boolean} [options.ignore] If true, INSERT will be executed as INSERT IGNORE (ignores duplicate keys)
     * @returns {Promise<Object>}
     */
    save(options?: {
        ignore?: boolean;
    }): Promise<object | false>;
    /**
     * Performs a DELETE operation on the currently loaded row.
     * @returns {Promise<void>}
     */
    delete(): Promise<void>;
    /**
     * @private
     * Resets the data of the currently loaded row.
     */
    reset(): void;
    /**
     * Syntax sugar to set multiple values at once.
     * @param {Object} data
     * @returns {Row}
     */
    setValues(data: object): Row;
    /**
     * Determines if a property exists on the row instance.
     * @param {string} property
     * @returns {boolean}
     */
    hasProperty(property: string): boolean;
    /** @type {Object} */
    get valuesObject(): any;
    get originalValues(): any;
    get PK(): number | null;
    get fieldPK(): any;
    get escapedPK(): any;
    get values(): any;
    get definition(): TableDefinition | null;
    get path(): string;
    get loaded(): boolean;
}
export default Row;
