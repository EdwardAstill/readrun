import React from "react";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card.tsx";

export interface QueryBlockProps {
	query: string;
	source?: string;
}

export function QueryBlock(props: QueryBlockProps): React.JSX.Element {
	return (
		<Card className="block-query">
			<CardHeader>
				<CardTitle>Query</CardTitle>
			</CardHeader>
			<CardContent>
				<pre>{props.query || props.source || ""}</pre>
			</CardContent>
		</Card>
	);
}
