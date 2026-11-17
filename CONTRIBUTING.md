# Contributing

Thanks for your interest. The project is a static three.js game: no build step, no dependency to install.

1. Requirements: Node 22.12+, Python 3 (local server only), a modern browser.
2. Run the game: `python tools/capture.py 8123`, then open <http://localhost:8123/>.
3. Run the tests before every commit: `sh tools/check.sh` (or `git config core.hooksPath tools/hooks` once per clone to automate it).
4. Check performance after touching rendering or scenery: `node tools/bench-quick.js [track]`.
5. Layout and conventions: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CODE-QUALITY.md](docs/CODE-QUALITY.md). Code, comments and documentation are in English. Issues and pull requests may be written in English or French.

Keep file names unique across the repository (e.g. `scenery-perse.js`): tools and stack traces rely on it. No JavaScript at the repository root.
