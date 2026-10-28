#!/usr/bin/env python3
"""Bundle the approved browser game locally; no npm/server or file-URL modules."""
import argparse
import re
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2]

def package(destination: Path):
    destination.mkdir(parents=True, exist_ok=True)
    rules = (SOURCE / 'rules.mjs').read_text()
    game = (SOURCE / 'game.mjs').read_text()
    if not game.startswith("import { assessStack, advanceSlider } from './rules.mjs';"):
        raise ValueError('Game imports changed; review the offline bundler before shipping.')
    rules = rules.replace('export function ', 'function ')
    game = game.split('\n', 1)[1]
    # Keep one source of truth. A classic script avoids WebKit file-origin module CORS.
    (destination / 'game.js').write_text("(() => {\n'use strict';\n" + rules + '\n' + game + '\n})();\n')
    html = (SOURCE / 'index.html').read_text()
    script = '<script type="module" src="game.mjs"></script>'
    if script not in html:
        raise ValueError('Game entry point changed; review the offline bundler.')
    html = html.replace(script, '<script src="game.js"></script>')
    html = html.replace('<meta name="theme-color"', '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; style-src \'self\'; img-src \'self\' data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'">\n  <meta name="theme-color"')
    (destination / 'index.html').write_text(html)
    css = (SOURCE / 'style.css').read_text()
    # In the native app the viewport is the device; remove the desktop frame on iPad.
    css += '\n/* Native host: edge-to-edge device viewport, no desktop frame. */\n.game { width: 100%; height: 100dvh; border: 0; border-radius: 0; box-shadow: none; }\n'
    (destination / 'style.css').write_text(css)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('destination', type=Path)
    package(parser.parse_args().destination)
