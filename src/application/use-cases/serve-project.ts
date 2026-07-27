import type { LiveChannel } from "../ports/live-channel.ts";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";

export interface ServerHandle {
	port: number;
	host: string;
	stop(): void;
	reload(): Promise<void>;
}

export interface ServeProjectInput {
	root: string;
	port: number;
	host?: string;
	watch?: boolean;
	clientEntry?: string;
	readProjectConfigDocuments?: (
		root: string,
	) => Promise<ProjectConfigDocuments>;
}

export interface ServeProjectPorts {
	liveChannel?: LiveChannel;
	startServer(
		input: ServeProjectInput & { liveChannel?: LiveChannel },
	): Promise<ServerHandle>;
}

export async function serveProject(
	input: ServeProjectInput,
	ports: ServeProjectPorts,
): Promise<ServerHandle> {
	return ports.startServer({
		...input,
		liveChannel: ports.liveChannel,
	});
}
