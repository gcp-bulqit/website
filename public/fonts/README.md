# ProggyClean Nerd Font

`ProggyCleanNerdFontPropo.woff2` is a subset of `ProggyCleanNerdFontPropo-Regular.ttf` from
[Nerd Fonts v3.5.1](https://www.nerdfonts.com/font-downloads) (ProggyClean © Tristan Grimmer, MIT; see `ProggyClean-LICENSE.txt`).

The full font is ~2.5 MB because of its icon sets, so it was cut down to ~6 KB with
[`subset-font`](https://www.npmjs.com/package/subset-font). It keeps:

- Basic Latin, Latin-1, general punctuation, arrows, box drawing, geometric shapes
- Icons: U+F09B github, U+F0E1 linkedin, U+F0E0 envelope, U+F042 adjust (theme toggle),
  U+F121 code, U+F0C1 link, U+F08E external-link

To use another icon (look up codes at https://www.nerdfonts.com/cheat-sheet), re-run the subset with it
added to the list, or it will render as a missing glyph.
