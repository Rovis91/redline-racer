# Local server for captures: http.server + POST /captures/<name>.jpg|json, saved in captures/ (ignored by git).
# Usage: python tools/capture.py 8801 (no argument: the PORT variable, else 8801), then open http://127.0.0.1:8801/tools/captures.html?map=wangan
import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        m = re.fullmatch(r'/captures/([\w-]+\.(?:jpg|json))', self.path)
        if not m: self.send_error(403); return
        os.makedirs('captures', exist_ok=True)
        with open(os.path.join('captures', m.group(1)), 'wb') as f: f.write(self.rfile.read(int(self.headers['Content-Length'])))
        self.send_response(204); self.end_headers()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()  # always serve the disk version, never the cached one
    def log_message(self, *a): pass
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))  # always serves the copy of the game containing this file (worktree included), wherever it is launched from
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1] if len(sys.argv) > 1 else os.environ.get('PORT', 8801))), H).serve_forever()
