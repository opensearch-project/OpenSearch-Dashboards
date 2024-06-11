#!/bin/bash

# Start the VNC server
export DISPLAY=:99

mkdir -p /home/.vnc

Xvfb :99 -screen 0 1280x1024x24 &

x11vnc -forever -display :99 -rfbport 5900 -passwd 123 -bg -o /home/.vnc/x11vnc.log

sudo -u osd-dev startlxde &

# Keep the container running
tail -f /dev/null
