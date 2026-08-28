---
title: "PixelKeepV2 Updates"
---

# Updates to Make to PixelKeepV2

Most of the intended updates to PixelKeepV2 have to do with markdown rendering/capabilities and viewing of note(s) content. 

## Markdown Rendering and Capabilities

I will be attaching/including a `README.md` that will be used as a reference for markdown-related changes to be made.
<br>
### HTML tag (images, audio, etc.) Rendering
- Within the attatched `README.md`, the first `<a>...</a>` block with the included `<picture>...</picture>` tag(s) renders as a codeblock and *not* as an image source (as I am fairly sure is what is *intended*). Modify this behavior to render as intended.
<br>
### Code Blocks
- Rendering of codeblocks *needs* to be language specific with regards to syntax highlighting.
- Current "purple outline" codeblock Rendering looks "tacky"; adjust codeblock UI to be more fitting of PixelKeep as a whole (specifically fitted for "amber-console" default UI).
- Line spacing of codeblocks is too "wide" (lines appear to far from one another from above to below); fix this.
<br>
### Inline-code
- Inline-code (`example`) rendering appears to similar to standard paragraph text rendering; adjust appearance to be slightly more contrasting (possible, a subtle shaded text background, or something to help identify as inline-code and not paragraph text).
<br>
### Line Breaks
- Currently, line breaks are not rendering/adhering to "standard" markdown "rules" (i.e. line break inserted after two presses of `ENTER`, or at end of paragraph *if* added *double-space* at end of paragraph before hitting `ENTER`). Adjust behavior to ensure "standard" adherence to markdown line break "rules".
<br>
### Table of Contents
- As noticed within reference `README.md`, clicking an item in its "Table of Contents" should have changed my relative location on the respective notes page view to the selected section. Instead, I am backed out of current note all together and returned back to main note selection page. Fix this behavior to work "as intended".
<br>
### `copy` UI Button Function

#### Line Spacing
- When copying note contents via the `copy` UI button, each line is separated by/with an additional newline; correct behavior to copy *exact*/*literal* contents of notes.

#### Add `copy` Button to Codeblocks
- Include an additional `copy` UI button in the top-righy corner of any/every rendered codeblock for copying to clipboard of *exact*/*literal* file/contents encased within codeblock.
