#!/bin/bash

echo "🧪 Testing Cloudflare Workers OIDC Provider (Local Development)"
echo "=============================================================="
echo

# Test OIDC Discovery
echo "📋 Testing OIDC Discovery endpoint:"
echo "curl http://localhost:8787/.well-known/openid-configuration"
curl -s http://localhost:8787/.well-known/openid-configuration | jq . 2>/dev/null || curl -s http://localhost:8787/.well-known/openid-configuration
echo
echo

# Test JWKS endpoint
echo "🔑 Testing JWKS endpoint:"
echo "curl http://localhost:8787/.well-known/jwks.json"
curl -s http://localhost:8787/.well-known/jwks.json
echo
echo

# Test user registration
echo "👤 Testing user registration:"
echo "curl -X POST http://localhost:8787/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"SecurePassword123!\",\"name\":\"Test User\"}'"
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123!","name":"Test User"}'
echo
echo

# Test user login
echo "🔐 Testing user login:"
echo "curl -X POST http://localhost:8787/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"SecurePassword123!\"}'"
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123!"}'
echo
echo

echo "✅ Local testing complete!"
echo "💡 The development server is running at: http://localhost:8787"
echo "📚 See README.md for more API endpoints and usage examples."
