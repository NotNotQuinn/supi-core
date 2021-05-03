export = Row;
declare class Row {
    /**
     * Creates a new Row instance
     * @param {Query} query
     * @param {string} database
     * @param {string} table
     * @returns {Promise<Row>}
     */
    constructor(query: any, database: string, table: string): Promise<Row>;
    /** @type {Query} */
    query: any;
    /**
     * Loads a row based on its primary key.
     * @param {number} primaryKey
     * @param {boolean} ignoreError
     * @returns {Promise<Row>}
     */
    load(primaryKey: number, ignoreError: boolean): Promise<Row>;
    /**
     * Saves the row.
     * If a primary key is present, saves the row as new (INSERT).
     * If not, saves an existing row (UPDATE).
     * @param {Object} options
     * @param {boolean} [options.ignore] If true, INSERT will be executed as INSERT IGNORE (ignores duplicate keys)
     * @returns {Promise<Object>}
     */
    save(options?: {
        ignore: boolean | undefined;
    }): Promise<Object>;
    /**
     * Performs a DELETE operation on the currently loaded row.
     * @returns {Promise<void>}
     */
    delete(): Promise<void>;
    /**
     * @private
     * Resets the data of the currently loaded row.
     */
    private reset;
    /**
     * Syntax sugar to set multiple values at once.
     * @param {Object} data
     * @returns {Row}
     */
    setValues(data: Object): Row;
    /**
     * Determines if a property exists on the row instance.
     * @param {string} property
     * @returns {boolean}
     */
    hasProperty(property: string): boolean;
    /** @type {Object} */
    get valuesObject(): Object;
    get originalValues(): {};
    get PK(): any;
    get fieldPK(): any;
    get escapedPK(): any;
    get values(): {};
    get definition(): any;
    get path(): any;
    get loaded(): boolean;
    #private;
}
