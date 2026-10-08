# Распознавание речи для «Поболтать с котиком»: faster-whisper, модель держится в памяти.
# POST / (тело = аудио webm/mp4/wav) -> {"text": "..."}. Слушает только 127.0.0.1. Аудио не сохраняется.
import json, os, subprocess, tempfile, time
import numpy as np
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from faster_whisper import WhisperModel

MODEL = os.environ.get('STT_MODEL', 'base')
model = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=2)
PROMPT = 'Привет, котик! Мурзик, Мурлок, умножение, уравнение, пятёрка, школа, мама, папа.'

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('content-length', 0))
        if n <= 0 or n > 3_000_000:
            self.send_response(413); self.end_headers(); return
        data = self.rfile.read(n)
        fd, path = tempfile.mkstemp(suffix='.audio')
        try:
            os.write(fd, data); os.close(fd)
            t = time.time()
            pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, timeout=20).stdout
            audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
            segs, info = model.transcribe(audio, language='ru', beam_size=1, vad_filter=True, initial_prompt=PROMPT, condition_on_previous_text=False)
            text = ' '.join(s.text.strip() for s in segs).strip()
            out = json.dumps({'text': text, 'sec': round(time.time() - t, 2)}, ensure_ascii=False).encode()
            self.send_response(200); self.send_header('content-type', 'application/json; charset=utf-8'); self.end_headers(); self.wfile.write(out)
        except Exception as e:
            self.send_response(500); self.end_headers(); self.wfile.write(str(e).encode()[:200])
        finally:
            try: os.unlink(path)
            except OSError: pass
    def log_message(self, *a): pass

ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('STT_PORT', '3017'))), H).serve_forever()
