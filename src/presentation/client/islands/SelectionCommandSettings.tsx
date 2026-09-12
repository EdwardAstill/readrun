import { useEffect, useState } from "react";
import { TERMINALS, type SelectionCommandSettings as CommandSettings } from "../../../shared/selection-commands.ts";
import { Button } from "../../components/ui/Button.tsx";
import { Switch } from "../../components/ui/Switch.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Textarea } from "../../components/ui/Textarea.tsx";
import { NativeSelect } from "../../components/ui/NativeSelect.tsx";
import { selectionCommandsAvailable, selectionCommandsRequest } from "../selection-commands-api.ts";

export function SelectionCommandSettings() {
	const [settings, setSettings] = useState<CommandSettings | null>(null);
	const [message, setMessage] = useState("");
	const [saving, setSaving] = useState(false);
	const available = selectionCommandsAvailable();
	useEffect(() => {
		if (!available) return;
		let active = true;
		void selectionCommandsRequest().then((value) => { if (active) setSettings(value); })
			.catch((error) => { if (active) setMessage(error.message); });
		return () => { active = false; };
	}, [available]);
	const update = (value: CommandSettings) => { setSettings(value); setMessage("Unsaved command changes."); };
	return <section className="grid gap-3 border-t pt-4" aria-labelledby="selection-commands-title">
		<h2 className="text-sm font-medium" id="selection-commands-title">Selection commands</h2>
		<p className="text-xs text-muted-foreground">{available
			? "Highlight document text and right-click to open OMP in a terminal. The prompt waits for you to press Enter."
			: "Available when reading through your local readrun server."}</p>
		{settings && <>
			<label className="grid gap-1 text-sm">Terminal
				<NativeSelect value={settings.terminal} onChange={(event) => update({ ...settings, terminal: event.target.value as CommandSettings["terminal"] })}>
					{TERMINALS.map((terminal) => <option key={terminal} value={terminal}>{terminal === "auto" ? "Detect automatically" : terminal}</option>)}
				</NativeSelect>
			</label>
			<label className="grid gap-1 text-sm">OMP executable
				<Input value={settings.ompExecutable} onChange={(event) => update({ ...settings, ompExecutable: event.target.value })} />
			</label>
			{settings.commands.map((command, index) => {
				const change = (patch: Partial<typeof command>) => update({ ...settings, commands: settings.commands.map((item, i) => i === index ? { ...item, ...patch } : item) });
				return <fieldset key={command.id} className="grid gap-2 rounded-lg border p-3">
					<legend className="px-1 text-sm">{command.label || "New command"}</legend>
					<label className="grid gap-1 text-sm">Menu label<Input value={command.label} maxLength={100} onChange={(event) => change({ label: event.target.value })} /></label>
					<label className="grid gap-1 text-sm">Prompt template<Textarea rows={5} value={command.prompt} maxLength={16000} onChange={(event) => change({ prompt: event.target.value })} /></label>
					<p className="text-xs text-muted-foreground">{"{selection} inserts highlighted text; {file} inserts the source file path."}</p>
					<div className="flex items-center justify-between gap-2">
						<label className="flex items-center gap-2 text-sm" htmlFor={`selection-enabled-${command.id}`}><Switch id={`selection-enabled-${command.id}`} checked={command.enabled} onCheckedChange={(enabled) => change({ enabled })} />Enabled</label>
						<Button variant="ghost" onClick={() => update({ ...settings, commands: settings.commands.filter((item) => item.id !== command.id) })}>Remove</Button>
					</div>
				</fieldset>;
			})}
			<div className="flex gap-2">
				<Button variant="outline" disabled={saving || settings.commands.length >= 30} onClick={() => update({ ...settings, commands: [...settings.commands, { id: crypto.randomUUID(), label: "New command", prompt: "Explain this from {file}:\n\n{selection}", enabled: true }] })}>Add command</Button>
				<Button disabled={saving} onClick={async () => {
					setSaving(true);
					try { await selectionCommandsRequest("", settings); setMessage("Commands saved."); }
					catch (error) { setMessage(error instanceof Error ? error.message : "Could not save commands."); }
					finally { setSaving(false); }
				}}>Save commands</Button>
			</div>
		</>}
		<p role="status" className="text-xs text-muted-foreground">{message}</p>
	</section>;
}
