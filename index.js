module.exports = (async function (namespace = "sb", options = {}) {
	globalThis[namespace] = {};

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
		"classes/reminder"
	];

	const { blacklist, whitelist, skipData = [] } = options;

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
		let component = require("./" + file);

		if (type === "objects") {
			globalThis[namespace][component.name] = component;
		}
		else if (type === "singletons") {
			globalThis[namespace][component.name] = await component.singleton();
		}
		else if (type === "classes") {
			if (skipData.includes(file)) {
				globalThis[namespace][component.specificName ?? component.name] = component;
			}
			else {
				globalThis[namespace][component.specificName ?? component.name] = await component.initialize();
			}
		}

		const end = process.hrtime.bigint();
		console.log(component.name + " loaded in " + Number(end - start) / 1.0e6 + " ms");
	}

	console.groupEnd();
});