#!/usr/bin/env python3
"""
Simple HTTP server to test basic Python performance
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import time

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        start_time = time.time()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "status": "healthy",
            "message": "Simple Python HTTP server",
            "timestamp": time.time()
        }
        
        self.wfile.write(json.dumps(response).encode())
        
        process_time = time.time() - start_time
        print(f"Request processed in {process_time:.3f}s")

if __name__ == "__main__":
    server = HTTPServer(('localhost', 8002), SimpleHandler)
    print("Starting simple HTTP server on port 8002...")
    server.serve_forever()
