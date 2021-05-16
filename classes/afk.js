/**
 * Represents a user's AFK status
 * @memberof sb
 * @type AwayFromKeyboard
 */
module.exports = class AwayFromKeyboard extends require("./template.js") {

	static data = [];

	constructor (data) {
		super();

		/**
		 * Unique AFK status identifier
		 * @type {number}
		 */
		this.ID = data.ID;

		/**
		 * Unique numeric user identifier
		 * @type {User.ID}
		 */
		this.User_Alias = data.User_Alias;

		/**
		 * The timestamp of AFK status setup
		 * @type {sb.Date}
		 */
		this.Started = data.Started;

		/**
		 * AFK status description
		 * @type {string}
		 */
		this.Text = data.Text;

		/**
		 * If true, the AFK status will not be broadcasted when the user comes back from AFK
		 * @type {boolean}
		 */
		this.Silent = data.Silent;

		/**
		 * Determines the sort of "action" the user was doing while being AFK.
		 * E.g. "no longer AFK", "no longer taking a shower", ...
		 * @type {string}
		 */
		this.Status = data.Status ?? "afk";
	}

	async serialize () {
		throw new sb.Error({
			message: "Module AwayFromKeyboard cannot be serialized"
		});
	}
	
	static async loadData () {
		const data = await sb.Query.getRecordset(rs => rs
			.select("*")
			.from("chat_data", "AFK")
			.where("Active = %b", true)
		);

		AwayFromKeyboard.data = data.map(record => new AwayFromKeyboard(record));
	}

	static async reloadSpecific (...list) {
		if (list.length === 0) {
			return false;
		}

		const promises = list.map(async (ID) => {
			const row = await sb.Query.getRow("chat_data", "AFK");
			await row.load(ID);

			const existingIndex = AwayFromKeyboard.data.findIndex(i => i.ID === ID);
			if (existingIndex !== -1) {
				AwayFromKeyboard.data[existingIndex].destroy();
				AwayFromKeyboard.data.splice(existingIndex, 1);
			}

			if (!row.values.Active) {
				return;
			}

			const afk = new AwayFromKeyboard(row.valuesObject);
			AwayFromKeyboard.data.push(afk);
		});

		await Promise.all(promises);
		return true;
	}

	/**
	 * Checks if an user is AFK.
	 * If they are, returns their AFK data and unsets the AFK status.
	 * If the status is set as not silent, also emits an event to Master to send a message
	 * @param {User} userData
	 * @param {Channel} channelData
	 * @returns {Promise<void>}
	 */
	static async checkActive (userData, channelData) {
		const index = AwayFromKeyboard.data.findIndex(i => i.User_Alias === userData.ID);
		if (index === -1) {
			return;
		}

		// Extract the AFK data *FIRST*, before anything else is awaited!
		// This makes sure that no more (possibly incorrect) messages are sent before the response is put together.
		const [data] = AwayFromKeyboard.data.splice(index, 1);

		// This should only ever update one row, if everything is working properly.
		await sb.Query.getRecordUpdater(rs => rs
			.update("chat_data", "AFK")
			.set("Active", false)
			.where("ID = %n", data.ID)
		);

		const afkCommand = sb.Command.get("afk");
		const status = sb.Utils.randArray(afkCommand.staticData.responses[data.Status]);

		if (!data.Silent) {
			const message = `${userData.Name} ${status}: ${data.Text} (${sb.Utils.timeDelta(data.Started)})`;

			let fixedMessage = (await Promise.all([
				channelData.prepareMessage(`${userData.Name} ${status}: `),
				channelData.prepareMessage(data.Text ?? "(no message)"),
				"(" + sb.Utils.timeDelta(data.Started) + ")"
			])).join(" ");

			fixedMessage = await sb.Filter.applyUnping({
				command: afkCommand,
				channel: channelData ?? null,
				platform: channelData?.Platform ?? null,
				string: fixedMessage
			});

			await Promise.all([
				channelData.send(fixedMessage),
				channelData.mirror(message, userData, false)
			]);
		}
	}

	/**
	 * Sets a user's AFK status.
	 * @param {User} userData
	 * @param {string} text
	 * @param {string} status
	 * @param {boolean} [silent] If true, user coming back will not be broadcast.
	 * @returns {Promise<void>}
	 */
	static async set (userData, text, status, silent) {
		const now = new sb.Date();
		const data = {
			User_Alias: userData.ID,
			Text: text || null,
			Silent: !!silent,
			Started: now,
			Status: status || "afk"
		};

		const row = await sb.Query.getRow("chat_data", "AFK");
		row.setValues(data);
		await row.save();

		data.ID = row.values.ID;
		AwayFromKeyboard.data.push(new AwayFromKeyboard(data));
	}
};