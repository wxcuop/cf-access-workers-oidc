#!/bin/bash

# Admin Dashboard Development Server
# Simple HTTP server for testing the admin dashboard locally

echo "🚀 Starting Local Development Server for Admin Dashboard"
echo "=================================================="

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "📦 Using Python 3 HTTP server"
    echo "🌐 Server will be available at: http://localhost:8081"
    echo "📁 Serving from: frontend/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd frontend/
    python3 -m http.server 8081
    
elif command -v python &> /dev/null; then
    echo "📦 Using Python 2 HTTP server"
    echo "🌐 Server will be available at: http://localhost:8081"
    echo "📁 Serving from: frontend/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd frontend/
    python -m SimpleHTTPServer 8081
    
else
    echo "❌ Error: Python is not installed!"
    echo "Please install Python or use another HTTP server to serve the files."
    exit 1
fi
