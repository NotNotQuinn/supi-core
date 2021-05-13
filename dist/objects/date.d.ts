/**
 * Extended and simpler-to-use version of native Date
 * @memberof stolen_sb
 * @namespace Date
 */
export default class sbDate extends global.Date {
    /**
     * Pads a number with specified number of zeroes.
     * @private
     * @param {number} number
     * @param {number} padding
     * @returns {string}
     */
    static zf(number: number, padding: number): string;
    /**
     * Compares two instances for their equality
     * @param {sbDate} from
     * @param {sbDate} to
     * @returns {boolean}
     */
    static equals(from: sbDate, to: sbDate): boolean;
    /**
     * Creates the instance. Uses the same constructor as native Date does.
     * @param {*} args
     */
    constructor(...args: any);
    /**
     * Formats the instance into specified format.
     * @param {string} formatString
     * @returns {string}
     */
    format(formatString: string): string;
    simpleDate(): string;
    simpleDateTime(): string;
    fullDateTime(): string;
    sqlDate(): string;
    sqlTime(): string;
    sqlDateTime(): string;
    /**
     * @param {number} offset in minutes
     * @returns {sbDate}
     */
    setTimezoneOffset(offset: number): sbDate;
    /**
     * Sets the provided time units to zero.
     * @param {...<"h"|"m"|"s"|"ms">} units
     * @returns {sbDate}
     */
    discardTimeUnits(...units: Array<"h" | "m" | "s" | "ms">): sbDate;
    clone(): sbDate;
    addYears(y: number): this;
    addMonths(m: number): this;
    addDays(d: number): this;
    addHours(h: number): this;
    addMinutes(m: number): this;
    addSeconds(s: number): this;
    addMilliseconds(ms: number): this;
    get dayOfTheWeek(): "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
    get milliseconds(): number;
    set milliseconds(ms: number);
    get seconds(): number;
    set seconds(s: number);
    get minutes(): number;
    set minutes(m: number);
    get hours(): number;
    set hours(h: number);
    get day(): number;
    set day(d: number);
    get month(): number;
    set month(m: number);
    get year(): number;
    set year(y: number);
}
