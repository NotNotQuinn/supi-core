import { ClassTemplate } from "./template";
import { CustomDate as Date } from "../objects/date";
import { Channel } from "./channel";
import { Platform } from "./platform";
import { User } from "./user";

import { LongTimeout } from "long-timeout";

type ConstructorData = {
	ID: number;
	Active: boolean;
	User_From: User["ID"];
	User_To: User["ID"];
	Channel: Channel["ID"];
	Text: string | null;
	Created: Date;
	Schedule: Date | null;
	Private_Message: boolean;
	Platform: Platform | null;
	Type: Type;
};

type Result = {
	success: boolean;
	cause?: string | null;
	ID?: Reminder["ID"];
};
type RemoveOptions = {
	permanent: boolean;
	cancelled: boolean;
};
type Type = "Reminder" | "Pingme";

export declare type Like = number | Reminder;

export declare class Reminder extends ClassTemplate {
	static LongTimeout: LongTimeout;
	static data: Map<User["ID"], Reminder[]>;
	static available: Map<Reminder["ID"], User["ID"]>;

	static #add (reminder: Reminder): void;
	static #remove (ID: Reminder["ID"], options: RemoveOptions): Promise<boolean>;

	static get (identifier: Like): Reminder | null;
	static create (data: ConstructorData, skipChecks?: boolean): Promise<Result>;
	static checkActive (targetUserData: User, channelData: Channel): Promise<void>;
	static checkLimits (userFrom: User, userTo: User, schedule?: Date): Promise<Result>;
	static createRelayLink (endpoint: string, params: string): Promise<string>;
	static clear (): void;
	static destroy (): void;

	readonly ID: number;
	readonly Active: boolean;
	readonly User_From: User["ID"];
	readonly User_To: User["ID"];
	readonly Channel: Channel["ID"] | null;
	readonly Text: string | null;
	readonly Created: Date;
	readonly Schedule: Date | null;
	readonly Private_Message: boolean;
	readonly Platform: Platform | null;
	readonly Type: Type;

	private timeout: LongTimeout | null;

	constructor (data: ConstructorData);

	activateTimeout (): Reminder;
	deactivate (permanent: boolean, cancelled: boolean): Promise<Reminder>;
	destroy (): void;
}
