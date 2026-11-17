"""Tell Bing, Yandex, Naver, Seznam (and the other IndexNow engines) that the site changed.

Run AFTER the push is live on GitHub Pages:   python _tools/indexnow.py

It submits every <loc> in sitemap.xml. The key file (<key>.txt at the site root) must already
be reachable at https://i-conomy.com/<key>.txt, or the engines reject the submission.
The folder starts with "_" so GitHub Pages does not publish it.
"""
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = 'i-conomy.com'
KEY = 'b8f91b6a78e5bdf19cb9a56479da14b5'

with open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8') as f:
    urls = re.findall(r'<loc>([^<]+)</loc>', f.read())

body = json.dumps({
    'host': HOST,
    'key': KEY,
    'keyLocation': f'https://{HOST}/{KEY}.txt',
    'urlList': urls,
}).encode('utf-8')

req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, method='POST',
                             headers={'Content-Type': 'application/json; charset=utf-8'})
with urllib.request.urlopen(req, timeout=30) as r:
    # 200 = accepted, 202 = accepted, key validation pending
    print(r.status, f'- submitted {len(urls)} URLs')
