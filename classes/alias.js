/* global sb */
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

    /**
     * Creates a new Alias object from data.
     * @param {Object} data
     * @param {string} data.Args
     * @param {number|null} data.Channel
     * @param {number|null} data.Copy_Of
     * @param {sb.Date} data.Created
     * @param {string|null} data.Description
     * @param {number} data.ID
     * @param {string} data.Invocation
     * @param {sb.Date|null} data.Last_Edit
     * @param {string} data.Name
     * @param {number|null} data.User_Alias
     */
	constructor (data) {
        super();
        this.Args = data.Args.split(" ");
        this.Channel = data.Channel;
        this.Copy_Of = data.Copy_Of;
        this.Created = data.Created;
        this.Description = data.Description;
        this.ID = data.ID;
        this.Invocation = data.Invocation;
        this.Last_Edit = data.Last_Edit;
        this.Name = data.Name;
        this.User_Alias = data.User_Alias;
	}

    /**
     * 
     * @param {Object|Alias} obj Object holding info to identify the alias you want to get.
     * @param {string} obj.Name
     * @param {sb.User|null} [obj.User]
     * @param {number|null} [obj.Channel]
     */
	static async get (obj) {
        if (obj instanceof Alias) {
            return obj;
        }
        let { User = null, Channel = null, Name } = obj;
        if (Name == undefined) throw new sb.Error({
            message: "Name must be provided when getting an alias.",
            requested_data: obj
        })
        let UserID = null;
        if (User !== null) {
            User = await sb.User.get(User);
            UserID = User.ID
        };

        let data = await sb.Query.getRecordset(rs=>{
            let UserCondition = UserID === null
                ? ["User_Alias = NULL"]
                : ["User_Alias = %n", UserID];
            let ChannelCondition = Channel === null
                ? ["Channel = NULL"]
                : ["Channel = %n", Channel];
            let NameCondition = Name === null
                ? ["Name = NULL"]
                : ["Name = %s", Name];

            return rs
                .select("*")
                .from("data", "aliased_command")
                .where(...UserCondition)
                .where(...ChannelCondition)
                .where(...NameCondition)
                .limit(1)
                .single()
        });

        return new Alias(data);
	}

	/**
	 * Checks if an alias exists, and executes it if needed.
     * @returns {AliasExecution}
	 */
	static async checkAndExecute (context, identifier, argumentArray, options = {}) {

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

    /**
     * 
     */
    static async loadData() {
        // No data...
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
