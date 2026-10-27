# css-animation-factory
CSS Animation Factory - Sprinkle that CSS into the factory yo!

### Getting Started
1. `git clone https://github.com/UnfocusedDrive/css-animation-factory.git` to copy to your current directory.
2. `cd css-animation-factory` to go to root.
1. `npm install` to install.
2. `npm run start` to run app.
3. `http://localhost:8080` to view in browser.

### Build
1. `npm run build` to generate a build to `/dist` directorry.

### Timeline
- Select a layer: a keyframe island floats over the preview with its animations, a diamond per keyframe, a scrubber and the animated properties' current values.
- Header ⋯ button (LinearScale icon): the Timeline panel, every layer on one time axis. Click or drag the ruler to scrub; click a diamond to jump to that keyframe; drag the panel's top edge to resize.
- **Space** plays/pauses; **J / K / L** play backwards / pause / play forwards. Speed: 1/10× to 4×, or Custom… (a decimal or a fraction). Play, pause, scrub, loop and speed apply to the whole preview at once.
- Works with any CSS animation (class properties, the `animation` shorthand, raw preset CSS): it reads what the browser is running.

### Element Editor
- **JSON** and **Compiled CSS**: the selected layer's data and CSS (classes + the @keyframes it runs). Both are editable and follow every change.
- **Compiled HTML**: the layer's markup, exactly what Export writes for it. Read-only.
- **Isolation mode** (Layers toolbar target button, or double-click a layer): only that layer shows, fitted to the view. Esc leaves.

### Animation JSON
- Header **JSON**: the whole animation (layers, classes, keyframes, the preset's CSS) as JSON, in the same format as the preset files in `src/data`. **Copy** it, or paste one in (a preset file works too) and **Import**: it replaces the current animation as one undo step. Anything that would run code or break the app (event handlers, `javascript:` links, `<script>`, bad tag names) is refused with the reason.

### Themes
- Header ☀/☾: light or dark. Header palette button: **Neutral** (near-black and grey, after MotionCraft) or the NURVUS navy (default). The violet accent stays in both. Both choices are remembered.

### Branches
1. All commits go to brain `main`

Thanks. Enjoy ~ ;)