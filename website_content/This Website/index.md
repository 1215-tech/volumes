---
title: This Website
publish: "true"
author:
  - Iris
  - Big Pickle
---
The visual style of the Volumes is heavily based on [The Pond](https://turntrout.com/welcome) by [TurnTrout](https://turntrout.com/about), as requested by the author the Volumes is open sourced under the CC BY-SA 4.0. Alex has made a very cool website and I recommend checking it out. That said, a lot has been modified, and I will try my best to document these modifications, as well as unique features here. The Volumes is heavily vibe-coded, currently with Big Pickle, since I couldn't be bothered learning to code. Taking this into account, if you want to take anything from this website - feel free to do so, but consider checking out the original. While it is a more complicated project, it is most likely much more stable and well rounded. 

---
## The "under the hood" changes

### Deployment

This site uses a simplified deployment pipeline compared to [The Pond](https://turntrout.com/welcome). The infrastructure that Alex has built *is* really cool, however, once again I could not be bothered with it. You can check out said infrastructure [here](https://turntrout.com/design#deployment-pipeline). The vast majority of this system was gutted. The original system included such things as:

- Playwright (33+ shards)
- Visual regression
- Lighthouse performance
- Accessibility (pa11y)
- Site build checks
- Shared build artifacts

Vs the current, simplified, setup: 

- Checkout → Install pnpm → Install Dependencies
- Install Playwright Browsers (for offline build)
- Install FFmpeg (for media processing)
- Setup Python Environment (via uv)
- Build Static Site → Deploy to Cloudflare Pages

### Added back the publish: false behavior

I like to "marinate" some of my notes, hence this change.

## Visual changes

The site uses Gruvbox color scheme.

### Color Palette

| Variable   | Color | Hex       | Description             |
| ---------- | ----- | --------- | ----------------------- |
| Background | Dark  | `#282828` | Gruvbox dark background |
| Foreground | Light | `#ebdbb2` | Cream/warm text color   |
| Gray       | -     | `#928374` | Muted mid-tone          |
| Red        | -     | `#fb4934` | Links (unvisited)       |
| Purple     | -     | `#d3869b` | Links (visited)         |
| Yellow     | -     | `#fabd2f` | Hover accents           |
| Green      | -     | `#b8bb26` | Success/positive        |
| Blue       | -     | `#458588` | Info/links variant      |
| Orange     | -     | `#fea43a` | Warnings/highlights     |
| Aqua       | -     | `#8ec07c` | Secondary green         |

## List of features, that are yet to be implemented

- A full graph view of the Volumes. The Pond, from what I can tell, had the module cut out
- Change the meta stuff (the pasting link images and title). Almost done, finish the embed image
- Implement the eye with tracking
- Fix the mobile picture 