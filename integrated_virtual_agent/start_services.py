#!/usr/bin/env python3
"""
Startup script to run both Flask AI Negotiator and Node.js Visual Agent services
"""
import subprocess
import time
import os
import signal
import sys
from threading import Thread

def run_flask_service():
    """Run the Flask AI Negotiator service"""
    print("Starting Flask AI Negotiator service on port 5000...")
    try:
        subprocess.run([
            "python3.11", "ai_negotiator_api_cors.py"
        ], cwd="/home/ubuntu/integrated_virtual_agent")
    except KeyboardInterrupt:
        print("Flask service interrupted")

def run_node_service():
    """Run the Node.js Visual Agent service"""
    print("Starting Node.js Visual Agent service on port 3000...")
    try:
        subprocess.run([
            "node", "server.js"
        ], cwd="/home/ubuntu/integrated_virtual_agent")
    except KeyboardInterrupt:
        print("Node.js service interrupted")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\nShutting down services...")
    sys.exit(0)

if __name__ == "__main__":
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start Flask service in a separate thread
    flask_thread = Thread(target=run_flask_service, daemon=True)
    flask_thread.start()
    
    # Wait a moment for Flask to start
    time.sleep(2)
    
    # Start Node.js service in main thread
    try:
        run_node_service()
    except KeyboardInterrupt:
        print("\nServices stopped")

