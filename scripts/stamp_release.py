#!/usr/bin/env python3
"""Stamp an immutable UTC release version into the static entry point."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys

MARKER = re.compile(r'<time id="app-version"(?=\s|>)[^>]*>[^<]*</time>')
ISO = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]/'docs')
    parser.add_argument('--check',action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    html_path = root/'index.html'
    html = html_path.read_text(encoding='utf-8')
    if args.check:
        version = json.loads((root/'version.json').read_text(encoding='utf-8'))['version']
        if not ISO.fullmatch(version):raise ValueError('Invalid release timestamp')
        datetime.fromisoformat(version.replace('Z','+00:00'))
        matches = MARKER.findall(html)
        if len(matches)!=1 or 'datetime="'+version+'"' not in matches[0] or '>'+version+'</time>' not in matches[0]:
            raise ValueError('Visible version and version.json differ')
        print(json.dumps({'checked':True,'version':version}))
        return
    if html.count('</body>')!=1 or len(MARKER.findall(html))>1:
        raise ValueError('Expected one body and at most one release marker')
    version = datetime.now(timezone.utc).isoformat(timespec='microseconds').replace('+00:00','Z')
    badge = '<time id="app-version" class="app-version" datetime="'+version+'" aria-label="Versão da aplicação em UTC">'+version+'</time>'
    html = MARKER.sub(lambda _:badge,html) if MARKER.search(html) else html.replace('</body>',badge+'</body>')
    # The entry point always refers to the code/style bytes from this release.
    for name in sorted(set(re.findall(r'(?:src|href)="([A-Za-z0-9_./-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?"',html))):
        digest = hashlib.sha256((root/name).read_bytes()).hexdigest()[:16]
        html = re.sub(r'((?:src|href)=")'+re.escape(name)+r'(?:\?v=[a-f0-9]+)?"',lambda m:m[1]+name+'?v='+digest+'"',html)
    html_path.write_text(html,encoding='utf-8')
    (root/'version.json').write_text(json.dumps({'version':version,'timezone':'UTC'},indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'version':version,'changed':['docs/index.html','docs/version.json']}))


if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError) as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
