class Alias extends require("./template.js") {
    //<editor-fold defaultstate="collapsed" desc="=== INSTANCE PROPERTIES ===">

	/**
	 * Unique numeric ID.
	 * @type {number}
	 */
	ID;

    /**
     * User ID tied to this alias, if any.
     * `User_Alias`, `Channel`, and `Name` together must be unique.
     * @type {number|null}
     */
    User_Alias;

    /**
     * Channel that is tied to this alias, if any.
     * `User_Alias`, `Channel`, and `Name` together must be unique.
     * @type {number|null}
     */
    Channel;

	/**
	 * Name of alias.
     * `User_Alias`, `Channel`, and `Name` together must be unique.
	 * @type {string}
	 */
	Name;

    /**
     * Command aliased.
     * @type {string}
     */
    Invocation;

    /**
     * Arguments passed when invoked.
     * @type {Array<string>}
     */
    Args;

    /**
	 * User provided description.
	 * @type {string|null}
	 */
    #Description;

    /**
     * User provided description.
     * @type {string|null}
     */
    get Description () { return this.#Description }
    set Description (desc) {
        if (desc === null) {
            this.#Description = null;
        }
        else if (typeof desc !== "string") {
            throw new sb.Error({
                message: `Cannot set sb.Alias.Description to type other than 'string' or null. Not '${typeof desc}'`,
                alias: this,
                attempted_value: desc
            });
        }
        else if (desc.length >= Alias.#descriptionLimit) {
            throw new sb.Error({
                message: `Length of sb.Alias.Description cannot be > ${Alias.#descriptionLimit}.`,
                alias: this
            })
        };
        this.#Description = desc;
    }
    /**
     * Creation date.
     * @type {sb.Date}
     */
    Created;

    /**
     * Last database update date.
     * @type {sb.Date|null}
     */
    Last_Edit;

    /**
     * ID of alias copied from, if any.
     * @type {number|null}
     */
    Copy_Of;

	// </editor-fold>

    static #aliasCallDepthLimit = 10;
    static #descriptionLimit = 250;
    static #nameCheck = {
        regex: /^[-\w\u00a9\u00ae\u2000-\u3300\ud83c\ud000-\udfff\ud83d\ud000-\udfff\ud83e\ud000-\udfff]{2,30}$/,
        response: "Your alias should only contain letters, numbers and be 2-30 characters long."
    }

	constructor (data) {
        this.ID = data.ID;
	}

    /**
     * 
     * @param {Object|Alias} obj Object holding info to identify the alias you want to get.
     * @param {sb.User} obj.User 
     * @param {Object} obj.Channel 
     * @param {Object} obj.Name
     */
	static get (obj) {
        if (obj instanceof Alias) {
            return obj;
        }
        const { user = null, channel = null, name = null } = obj;
	}

	/**
	 * Checks if an alias exists, and executes it if needed.
     * @returns {AliasExecution}
	 */
	static async checkAndExecute (identifier, argumentArray, channelData, userData, options = {}) {

	}

    /**
     * Gets a row of the current Alias from sb.Query
     * @returns {Promise<sb.Query.row>}
     */
    async getRow () {
        let row = await sb.Query.getRow("data", "aliased_command");
        row.load(this.ID);
        return row;
    }

	static applyParameters (context, aliasArguments, commandArguments) {
        const resultArguments = [];
        const numberRegex = /(?<order>\d+)(-(?<range>\d+))?(?<rest>\+?)/;

        for (let i = 0; i < aliasArguments.length; i++) {
            const parsed = aliasArguments[i].replace(/\${(.+?)}/g, (total, match) => {
                const numberMatch = match.match(numberRegex);
                if (numberMatch) {
                    const order = Number(numberMatch.groups.order);
                    const useRest = (numberMatch.groups.rest === "+");
                    const range = (numberMatch.groups.range) ? Number(numberMatch.groups.range) : null;

                    if (useRest && range) {
                        return {
                            success: false,
                            reply: `Cannot combine both the "range" and "rest" argument identifiers!`
                        };
                    }
                    else if (useRest) {
                        return commandArguments.slice(order).join(" ");
                    }
                    else if (range) {
                        return commandArguments.slice(order, range).join(" ");
                    }
                    else {
                        return commandArguments[order] ?? "";
                    }
                }
                else if (match === "executor") {
                    return context.user.Name;
                }
                else if (match === "channel") {
                    return context.channel?.Description ?? context.channel?.Name ?? "[whispers]";
                }
                else {
                    return total;
                }
            });

            resultArguments.push(...parsed.split(" "));
        }

        return {
            success: true,
            resultArguments
        };
    }
}
module.exports = Alias;

/**
 * @typedef {Object} AliasResult
 * @property {boolean} success If true, result exists; If false, result does not exist.
 * @property {CommandResult} [result] Result of the aliased command.
 * @property {string} [reason] Textual explanation of the reason the alias failed.
 * @property {Object} [meta] Any other information passed back from the alias execution.
 */

/**
 * @typedef {Object} CommandResult
 * @property {boolean} success If true, result contains reply; if false, result contains error
 * @property {string} [reply] Command result as a string to reply. If not provided, no message should be sent
 * @property {Object} [cooldown] Dynamic cooldown settings
 * @property {string} [reason] Symbolic description of why command execution failed - used internally
 * @property {Object} [meta] Any other information passed back from the commend execution
 */
