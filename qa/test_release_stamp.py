import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1]/'scripts/stamp_release.py'

class ReleaseStampTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=os.environ.get('TMPDIR', str(Path.home()/'.hermes/cache/scratch')))
        self.root = Path(self.temp.name)
        (self.root/'index.html').write_text('<html><head><link rel="stylesheet" href="style.css"></head><body>Approved story<script src="app.js"></script></body></html>')
        (self.root/'style.css').write_text('body{color:green}')
        (self.root/'app.js').write_text('window.example=true;')
    def tearDown(self):
        self.temp.cleanup()
    def run_stamp(self,*args):
        self.assertTrue(SCRIPT.exists(),'Deploys require an automatic release timestamp generator')
        return subprocess.run([sys.executable,str(SCRIPT),'--root',str(self.root),*args],capture_output=True,text=True)
    def test_iso_timestamp_matches_visible_version_and_changes_per_release(self):
        result=self.run_stamp();self.assertEqual(result.returncode,0,result.stderr)
        first=json.loads((self.root/'version.json').read_text())['version']
        self.assertRegex(first,r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$')
        html=(self.root/'index.html').read_text()
        self.assertIn('id="app-version"',html);self.assertIn('datetime="'+first+'"',html);self.assertIn('>'+first+'</time>',html)
        self.assertIn('Approved story',html);self.assertEqual(html.count('id="app-version"'),1)
        self.assertEqual(self.run_stamp('--check').returncode,0)
        result=self.run_stamp();self.assertEqual(result.returncode,0,result.stderr)
        second=json.loads((self.root/'version.json').read_text())['version'];self.assertNotEqual(first,second)
        self.assertEqual((self.root/'index.html').read_text().count('id="app-version"'),1)
    def test_check_does_not_change_version_and_detects_tampering(self):
        self.assertEqual(self.run_stamp().returncode,0)
        before=(self.root/'index.html').read_bytes();self.assertEqual(self.run_stamp('--check').returncode,0);self.assertEqual((self.root/'index.html').read_bytes(),before)
        (self.root/'version.json').write_text('{"version":"bad"}')
        self.assertNotEqual(self.run_stamp('--check').returncode,0)

if __name__=='__main__':unittest.main()
