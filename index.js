module.exports = (async function (namespace, options = {}) {
	/**
	 * Global namespace wrapper.
	 * @namespace
	 * @type {Object}
	 */
	globalThis.sb = {};

	const files = [
		"objects/date",
		"objects/error",
		"objects/errors",
		"objects/promise",
		"objects/url-params",

		"singletons/query",
		"classes/config",
		"singletons/utils",
		"classes/cron",
		"singletons/cache",
		"singletons/cooldown-manager",
		"singletons/system-log",
		"singletons/vlc-connector",
		"singletons/twitter",
		"singletons/local-request",
		"singletons/runtime",
		"singletons/sandbox",
		
		"classes/got",
		"singletons/pastebin",
		
		"classes/platform",
		"classes/filter",
		"classes/command",
		"classes/channel",
		"classes/chat-module",
		"classes/user",
		"singletons/logger",
		"classes/afk",
		"classes/banphrase",
		"classes/reminder",
		"classes/alias"
	];

	const {
		blacklist,
		whitelist,
		skipData = []
	} = options;

	console.groupCollapsed("module load performance");

	for (const file of files) {
		if (blacklist && blacklist.includes(file)) {
			continue;
		}
		else if (whitelist && !whitelist.includes(file)) {
			continue;
		}

		const start = process.hrtime.bigint();
		const [type] = file.split("/");
		const component = require(`./${file}`);

		if (type === "objects") {
			sb[component.name] = component;
		}
		else if (type === "singletons") {
			sb[component.name] = await component.singleton();
		}
		else if (type === "classes") {
			if (skipData.includes(file)) {
				sb[component.specificName ?? component.name] = component;
			}
			else {
				sb[component.specificName ?? component.name] = await component.initialize();
			}
		}

		const end = process.hrtime.bigint();
		console.log(`${component.name} loaded in ${Number(end - start) / 1e6} ms`);
	}

	console.groupEnd();
});
