# Browser verification

Run `npm run build && npm start`, then open `http://localhost:5180`.

1. Select the title, change its text, and verify the canvas updates. Change font, size, rotation, and color.
2. Add a sticker, drag it, and move it with arrow keys. Shift + arrow moves 10 units; an arrow moves 2. Verify undo/redo.
3. Duplicate a layer, bring it to the top, and remove it. Select it from Layers as well as the canvas.
4. Replace the photo with each bundled photograph. Check warm, vintage, and monochrome filters. Use zoom and both crop sliders.
5. Upload JPG/PNG/WebP. Verify it is decoded locally, crop resets, and invalid formats or files above 15 MB give an error.
6. Flip the postcard. Edit message, recipient, and signature. Pick another postage stamp and paper/ink color.
7. Save, reload, open My postcards, and reopen the saved card. Save edits again: the count must not increase.
8. Start a new template, cancel once, then accept. Undo must recover the previous design.
9. Export both sides. Open the downloaded files and confirm 2400 × 1600 dimensions, photographs, fonts, and notes.
10. Check at 1440, 768, and 390 CSS pixels. Mobile tools must open and close without horizontal page overflow. Check keyboard focus and dialog Escape behavior.
11. Inspect browser errors. Enable reduced motion in your OS and verify the flip does not require motion to understand the state.

These are manual acceptance steps, not a claim that a cross-browser automation suite exists. Automated tests cover document validation, template isolation, and upload preflight validation.

12. Download postcard PDF from either tab. Confirm two pages in front/note order, each 432 × 288 points (6 × 4 inches), and verify the printing guide. Confirm the existing PNG export still downloads only the selected side.
