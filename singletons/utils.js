module.exports = (function () {
	"use strict";
	return class Utils extends require("./template.js") {
		get modules () {
			return moduleProxy;
		}

		/** @inheritDoc */
		static singleton () {
			if (!Utils.module) {
				Utils.module = new Utils();
			}
			return Utils.module;
		}

		/**
		 * Returns onversion numbers between two time units.
		 * @returns {Object}
		 */
		static get timeUnits () {
			return {
				y: {d: 365, h: 8760, m: 525600, s: 31536000, ms: 31536000.0e3},
				d: {h: 24, m: 1440, s: 86400, ms: 86400.0e3},
				h: {m: 60, s: 3600, ms: 3600.0e3},
				m: {s: 60, ms: 60.0e3},
				s: {ms: 1.0e3}
			};
		}

		/**
		 * Class containing various utility methods that don't fit elsewhere.
		 * @name stolen_sb.Utils
		 * @type Utils()
		 */
		constructor () {
			super();
		}


		isValidInteger (input, minLimit = 0) {
			if (typeof input !== "number") {
				return false;
			}

			return Boolean(Number.isFinite(input) && Math.trunc(input) === input && input >= minLimit);
		}

		get modulePath () { return "utils"; }

		/** @inheritDoc */
		destroy () {
			this.duration = null;
			this.mersenneRandom = null;
		}
	};
})();