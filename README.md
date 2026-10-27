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
- **Space** plays/pauses. Play, pause, scrub, loop and speed apply to the whole preview at once.
- Works with any CSS animation (class properties, the `animation` shorthand, raw preset CSS): it reads what the browser is running.

### Branches
1. All commits go to brain `main`

Thanks. Enjoy ~ ;)