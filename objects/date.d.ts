export = sbDate;
declare class sbDate extends Date {
    /**
     * Pads a number with specified number of zeroes.
     * @private
     * @param {number} number
     * @param {number} padding
     * @returns {string}
     */
    private static zf;
    /**
     * Compares two instances for their equality
     * @param {sbDate} from
     * @param {sbDate} to
     * @returns {boolean}
     */
    static equals(from: any, to: any): boolean;
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
    setTimezoneOffset(offset: number): any;
    /**
     * Sets the provided time units to zero.
     * @param {...<"h"|"m"|"s"|"ms">} units
     * @returns {sbDate}
     */
    discardTimeUnits(...units: any[]): any;
    clone(): any;
    addYears(y: any): sbDate;
    addMonths(m: any): sbDate;
    addDays(d: any): sbDate;
    addHours(h: any): sbDate;
    addMinutes(m: any): sbDate;
    addSeconds(s: any): sbDate;
    addMilliseconds(ms: any): sbDate;
    get dayOfTheWeek(): "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
    set milliseconds(arg: number);
    get milliseconds(): number;
    set seconds(arg: number);
    get seconds(): number;
    set minutes(arg: number);
    get minutes(): number;
    set hours(arg: number);
    get hours(): number;
    set day(arg: number);
    get day(): number;
    set month(arg: number);
    get month(): number;
    set year(arg: number);
    get year(): number;
}
