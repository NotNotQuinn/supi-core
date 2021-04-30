module.exports = (async function (namespace = "stolen_sb", options = {}) {
	globalThis[namespace] = {};
	const files = [
		"objects/date",
		"objects/error",
		"singletons/query",
		"singletons/utils"
	];

	const { blacklist, whitelist } = options;

	console.groupCollapsed("module load performance");

	for (const file of files) {
		if (blacklist && blacklist.includes(file)) {
			continue;
		}
		else if (whitelist && !whitelist.includes(file)) {
			continue;
		}

		const [type] = file.split("/");
		console.time("Module load: " + file);
		let component = require("./" + file);

		if (type === "objects") {
			core[component.name] = component;
		}
		else if (type === "singletons") {
			core[component.name] = await component.singleton();
		}

		console.timeEnd("Module load: " + file)
	}

	console.groupEnd();
});