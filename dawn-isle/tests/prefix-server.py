"""Serve the repository under a GitHub Pages-style prefix for local verification."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import argparse

parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=4175)
args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
prefix='/edwardofclt-gamestudio'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=str(root),**kw)
    def do_GET(self):
        parsed=urlsplit(self.path)
        if parsed.path==prefix:
            self.send_response(302)
            self.send_header('Location',prefix+'/')
            self.end_headers()
            return
        if not parsed.path.startswith(prefix+'/'):
            self.send_error(404)
            return
        self.path=self.path[len(prefix):]
        super().do_GET()

ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
