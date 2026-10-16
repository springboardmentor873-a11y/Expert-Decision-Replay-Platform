#!/usr/bin/env python3
"""
Backwards-compatible wrapper. Calls push_to_github.py.
"""
import sys
import subprocess
import os

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(script_dir, "push_to_github.py")
    subprocess.run([sys.executable, target] + sys.argv[1:])
