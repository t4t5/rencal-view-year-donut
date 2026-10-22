# Year Donut

A [renCal](https://rencal.org) view that shows the whole year as a ring. 1 January is at the top and the year runs clockwise, one slice per day.

- **Inner band:** timed events, stacked outwards from the centre in start order, in their calendar colour.
- **Outer lanes:** all-day and multi-day events, drawn as arcs across the days they cover.
- **Outer ring:** months, with ticks at the start of each week and shading on weekends.
- **Needle:** today.

Hover a day to see its events in the centre, and click it to select it. Clicking a segment or a row in the centre opens the event.

## Installation

Add the repository to `~/.config/rencal/plugins.toml`:

```toml
plugins = ["t4t5/rencal-view-year-donut"]
```

## Development

```sh
pnpm install
pnpm build
```

Add the checkout to `~/.config/rencal/plugins.toml` to try it, and renCal reloads it on every build. `dist/` is not committed: renCal installs the built files from the latest GitHub release.

## Releasing

Push a version tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The [release workflow](.github/workflows/release.yml) builds the view and creates a draft release with `dist/year-donut.js` and `dist/year-donut.css` attached. Check the draft on GitHub and publish it; renCal installs the latest published release and shows its tag as the version.
