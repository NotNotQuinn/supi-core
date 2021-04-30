export = Batch;
declare class Batch {
    /**
     * Creates a new Batch instance. Constructor must be await-ed.
     * @param {Query} query
     * @param {string} db
     * @param {string} table
     * @param {string[]} columns
     * @returns {Promise<Batch>}
     * @throws stolen_sb.Error If a nonexistent column has been provided
     */
    constructor(query: any, db: string, table: string, columns: string[]);
    /** @type {Query} */
    query: any;
    /** @type {string} */
    database: string;
    /** @type {string} */
    table: string;
    /** @type {Object[]} */
    records: Object[];
    /** @type {ColumnDefinition[]} */
    columns: any[];
    /** @type {boolean} */
    ready: boolean;
    /**
     * Adds a data record, based on the Batch's columns definition
     * @param {Object} data
     * @returns {number} The index of added data record
     */
    add(data: Object): number;
    /**
     * Deletes a record based on its index
     * @param index
     */
    delete(index: any): void;
    /**
     * Attempts to find a record based on a callback function
     * @param {Function} callback
     * @returns {Object|null} record
     */
    find(callback: Function): Object | null;
    /**
     * Executes the INSERT statement for bound database, table and columns.
     * Automatically clears itself after the statement is executed.
     * @param {Object} options Additional options
     * @param {boolean} options.ignore If true, batch will use `INSERT IGNORE INTO`.
     * @param {Function} options.duplicate If set, will use the result of this callback to create ON DUPLICATE KEY clausule.
     * @returns {Promise<void>}
     */
    insert(options?: {
        ignore: boolean;
        duplicate: Function;
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
