# Flowcharts

Flowcharts show workflows and processes as connected cards, with panning and zoom controls.
Drag cards to rearrange them. **Reset layout** restores their original positions
and fits the whole graph in view. Layout changes stay in the viewer and do not
change the source file.

## Embed a flowchart

Store the graph in `.readrun/assets/files/workflow.json`, then embed it:

```text
[flowchart=files/workflow.json title="Publishing workflow" height=540]
```

[flowchart=files/workflow.json title="Publishing workflow" height=540]

## Define nodes and connections

The graph is stored as JSON. A minimal file looks like this:

```json
{
  "nodes": [
    { "id": "start", "position": { "x": 0, "y": 0 }, "data": { "label": "Start", "description": "Prepare the content." } },
    { "id": "finish", "position": { "x": 0, "y": 180 }, "data": { "label": "Finish" } }
  ],
  "edges": [
    { "id": "next", "source": "start", "target": "finish", "label": "Ready" }
  ]
}
```

Each node needs a unique `id`, a numeric `position` (`x`, `y`), and `data.label`.
`data.description` is optional. Cards are 240 pixels wide; leave room between
positions for their text. Layout is explicit, with incoming connections at the
top and outgoing connections at the bottom.

Each edge needs a unique `id` and existing node IDs for `source` and `target`;
`label` is optional. Connections have arrows by default; set `"arrow": false`
on an edge for a plain connection, or `"arrow": true` for an explicit arrow.
The publishing example above uses both styles. Card and edge text is plain text.
The viewer fits the graph on load and supports panning and zoom controls.
The default height is 480 pixels. Flowcharts work in both served and static sites.
Invalid JSON or broken node references display an error inside the viewer.
