from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright


NODE_PAYLOAD = r"""
import fs from 'node:fs';
import { runtimeFixtureHtml, enterThreadState } from './tests/runtime-fixture.mjs';
import { payloadFromThemeFile } from './runtime/forge-runtime.mjs';
import { makeApplyExpression } from './runtime/injection-plan.mjs';
const payload = payloadFromThemeFile('themes/active.json');
const styleSheet = fs.readFileSync('runtime/forge-theme.css', 'utf8');
const enterWrapper = enterThreadState.toString();
const enterMarker = 'page.evaluate(';
const enterStart = enterWrapper.indexOf(enterMarker) + enterMarker.length;
const enterBody = enterWrapper.slice(enterStart, enterWrapper.lastIndexOf(')'));
console.log(JSON.stringify({
  html: runtimeFixtureHtml,
  apply: makeApplyExpression({ styleSheet, variables: payload.variables }),
  enterThread: `(${enterBody})()`
}));
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Capture the V11 native-shell runtime fixture.")
    parser.add_argument("--node", required=True, help="Absolute Node.js executable path")
    parser.add_argument("--output-dir", default="docs/screenshots", help="Repository-relative screenshot directory")
    parser.add_argument("--tag", default="runtime-v11-fixture", help="Unique output filename prefix")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    output_dir = (root / args.output_dir).resolve()
    output_dir.relative_to(root)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "landing": output_dir / f"{args.tag}-landing.png",
        "thread": output_dir / f"{args.tag}-thread.png",
        "report": output_dir / f"{args.tag}.json",
    }
    existing = [str(path) for path in outputs.values() if path.exists()]
    if existing:
        raise FileExistsError(f"Refusing to overwrite retained QA artifacts: {existing}")

    result = subprocess.run(
        [args.node, "--input-type=module", "-e", NODE_PAYLOAD],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    payload = json.loads(result.stdout)
    console_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=1)
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.set_content(payload["html"], wait_until="networkidle")
        page.evaluate(payload["apply"])
        page.screenshot(path=outputs["landing"])
        page.evaluate(payload["enterThread"])
        page.wait_for_timeout(800)
        page.screenshot(path=outputs["thread"])
        summary = page.evaluate("""() => ({
          scene: document.documentElement.dataset.forgeScene,
          mode: document.documentElement.dataset.forgeMode,
          composer: document.querySelector('.forge-composer')?.getBoundingClientRect().toJSON(),
          rightCard: document.querySelector('.forge-right-card')?.getBoundingClientRect().toJSON(),
          sidebar: document.querySelector('.forge-sidebar')?.getBoundingClientRect().toJSON(),
          assistantFrameless: [...document.querySelectorAll('.forge-assistant-message')].every(element => {
            const style = getComputedStyle(element);
            return style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.boxShadow === 'none';
          })
        })""")
        browser.close()

    report = {"summary": summary, "consoleErrors": console_errors}
    outputs["report"].write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
