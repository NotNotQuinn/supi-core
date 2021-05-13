import Query from './index';
import { WhereHavingParams, FormatSymbol } from './index';
declare class Recordset {
    #private;
    /**
     * Creates a new Recordset instance.
     * @param {Query} query
     * @name {Recordset}
     */
    constructor(query: Query);
    /**
     * Sets a flag so the recordset will return the first result directly instead of returning an array.
     * @returns {Recordset}
     */
    single(): Recordset;
    /**
     * Sets for the query result to be an array of primitives, instead of an array of objects.
     * The object will be flattened, and only the field values will be preserved.
     * @param {string} field
     */
    flat(field: string): this;
    /**
     * Sets an option to be used when constructing the SQL query.
     * @param {string} option
     * @param {*} value
     */
    use(option: string, value: any): this;
    /**
     * Sets the LIMIT.
     * @param {number} number
     * @returns {Recordset}
     * @throws {sbError} If number is not a finite number
     */
    limit(number: number): Recordset;
    /**
     * Sets the OFFSET.
     * @param {number} number
     * @returns {Recordset}
     * @throws {sbError} If number is not a finite number
     */
    offset(number: number): Recordset;
    /**
     * Sets SELECT fields.
     * @param {string[]} args
     * @returns {Recordset}
     */
    select(...args: string[]): Recordset;
    /**
     * Sets the FROM table
     * @param {string} database
     * @param {string} table
     * @returns {Recordset}
     */
    from(database: string, table: string): Recordset;
    /**
     * Sets a GROUP BY statement.
     * @param {string[]} args
     * @returns {Recordset}
     */
    groupBy(...args: string[]): Recordset;
    /**
     * Sets an ORDER BY statement.
     * @param {string[]} args
     * @returns {Recordset}
     */
    orderBy(...args: string[]): Recordset;
    /**
     * Sets a WHERE condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array.<string|FormatSymbol|WhereHavingParams>} args
     * @returns {Recordset}
     */
    where(...args: Array<string | FormatSymbol | WhereHavingParams>): Recordset;
    /**
     * Sets a HAVING condition.
     * First parameter can be an option argument {@link WhereHavingParams}
     * Multiple formatting symbols {@link FormatSymbol} can be used
     * @param {Array} args
     * @returns {Recordset}
     */
    having(...args: Array<any>): Recordset;
    /**
     * Sets a HAVING/WHERE condition, avoids duplicate code
     * @private
     * @param {"where"|"having"} type
     * @param {Array} args
     * @returns {Recordset}
     */
    conditionWrapper(type: "where" | "having", ...args: Array<any>): Recordset;
    /**
     * Sets a table to JOIN.
     * @param {string|Object} target If string, represents the name of the table to join.
     * @param {string} [target.raw] If target is Object, and raw is specified, parsing is skipped and the string is used directly.
     * @param {string} database Database of joined table
     * @param {string} [customField] If set, attempts to join the table via specific field
     * @param {string} left
     * @returns {Recordset}
     */
    join(database: {
        [x: string]: undefined | string;
    }, target?: string | {
        raw?: string;
    }, customField?: string, left?: string): Recordset;
    /**
     * Sets a table to LEFT JOIN.
     * @todo - this needs a better implementation
     * @param {string|{raw?: string}} target If string, represents the name of the table to join.
     * If target is Object, and raw is specified, parsing is skipped and the string is used directly.
     * @param {string} database Database of joined table
     * @param {string} [customField] If set, attempts to join the table via specific field
     * @returns {Recordset}
     */
    leftJoin(database: {
        [x: string]: undefined | string;
    }, target?: string | Object | {
        raw?: string;
    }, customField?: string): Recordset;
    /**
     * For more info and detailed usage, check `./reference.md`
     */
    reference(options?: {
        [x: string]: undefined | string;
    } & {
        fields?: string[];
    }): this;
    /**
     * Returns Recordset's WHERE condition.
     * @returns {string}
     */
    toCondition(): string;
    /**
     * Translates Recordset to its SQL representation
     * @returns {string[]}
     * @throws {sbError} If no SELECT statement has been provided. The entire Recordset makes no sense should this happen
     */
    toSQL(): string[];
    /**
     * Executes the SQL query and converts received values to their JS representation.
     * @returns {Promise<Array>}
     */
    fetch(): Promise<Array<any>>;
    static collapseReferencedData(data: {
        [x: number]: any;
        [x: string]: any;
    }[], options: {
        collapseOn: any;
        target: string;
        columns: string[];
    }): void;
}
export = Recordset;
