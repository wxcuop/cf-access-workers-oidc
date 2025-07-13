#!/bin/bash

# Local Development Server
# Simple HTTP server for testing the frontend locally

echo "🚀 Starting Local Development Server for Sign-In Page"
echo "=================================================="

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "📦 Using Python 3 HTTP server"
    echo "🌐 Server will be available at: http://localhost:8080"
    echo "📁 Serving from: frontend/signin/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd frontend/signin/
    python3 -m http.server 8080
    
elif command -v python &> /dev/null; then
    echo "📦 Using Python 2 HTTP server"
    echo "🌐 Server will be available at: http://localhost:8080"
    echo "📁 Serving from: frontend/signin/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd frontend/signin/
    python -m SimpleHTTPServer 8080
    
elif command -v node &> /dev/null; then
    echo "📦 Using Node.js (npx serve)"
    echo "🌐 Server will be available at: http://localhost:8080"
    echo "📁 Serving from: frontend/signin/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd frontend/signin/
    npx serve -p 8080 .
    
else
    echo "❌ No suitable HTTP server found"
    echo "Please install one of the following:"
    echo "  - Python 3: python3 -m http.server 8080"
    echo "  - Python 2: python -m SimpleHTTPServer 8080"
    echo "  - Node.js: npx serve -p 8080 ."
    echo ""
    echo "Then navigate to frontend/signin/ and run the server"
    exit 1
fi
