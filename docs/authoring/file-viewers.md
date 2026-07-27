# File Viewers

readrun can embed rich file types inline in any page — no Python, no JSX, no config.
Files live under `.readrun/assets/`; the demo keeps viewer examples in `.readrun/assets/files/`.

---

## 3D Models — STL

STL files render as interactive Three.js viewers. Orbit with mouse, zoom with scroll.

[stl=files/object.stl]

```
[stl=files/object.stl]
[stl=files/object.stl height=520]
```

Supported: `.stl` (ASCII and binary).

---

## 3D Models — GLTF / GLB

GLTF files support full materials, textures, and scene hierarchies.

[model=files/scene.gltf]

```
[model=files/scene.gltf]
[model=files/scene.glb height=600]
```

Supported: `.gltf`, `.glb`.

---

## CSV Tables

CSV files render as interactive tables with sort-by-column, text filter, and pagination.

[csv=files/results.csv]

```
[csv=files/results.csv]
```

Data is embedded at build time — works offline and in static builds.

---

## Audio

[audio=files/talk.mp3]

```
[audio=files/talk.mp3]
[audio=files/talk.mp3 loop=true]
```

Supported: `.mp3`, `.wav`, `.ogg`, `.m4a`.

---

## Video

[video=files/demo.mp4 height=360]

```
[video=files/demo.mp4]
[video=files/demo.mp4 height=360 loop=true muted=true]
```

Supported: `.mp4`, `.webm`, `.ogv`.

---

## PDF

[pdf=files/spec.pdf height=500]

```
[pdf=files/spec.pdf]
[pdf=files/spec.pdf height=700]
```

Renders using the browser's native PDF viewer inside a sandboxed iframe.

---

## All attributes

| Block | Attribute | Default | Notes |
|---|---|---|---|
| `stl`, `model` | `height` | 480px | Clamped 240–1200 |
| `audio` | `loop` | false | |
| `audio` | `autoplay` | false | |
| `video` | `height` | auto | Browser aspect ratio if omitted |
| `video` | `loop` | false | |
| `video` | `muted` | false | Required when `autoplay=true` |
| `pdf` | `height` | 600px | Clamped 300–1200 |
