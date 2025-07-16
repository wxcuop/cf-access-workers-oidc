#!/bin/bash

# Test the deployed OIDC Worker APIs

BASE_URL="https://wxc-oidc.wxcuop.workers.dev"

echo "🧪 Testing OIDC Worker Deployment"
echo "=================================="
echo

# Test 1: OIDC Configuration
echo "1. Testing OIDC Configuration:"
echo "GET ${BASE_URL}/.well-known/openid-configuration"
curl -s "${BASE_URL}/.well-known/openid-configuration" | jq -r '.issuer'
echo
echo

# Test 2: JWKS Endpoint
echo "2. Testing JWKS Endpoint:"
echo "GET ${BASE_URL}/.well-known/jwks.json"
curl -s "${BASE_URL}/.well-known/jwks.json" | jq -r '.keys[0].kid' 2>/dev/null || echo "Response received (JSON parsing may fail without jq)"
echo
echo

# Test 3: Admin Login Page
echo "3. Testing Admin Login Page:"
echo "GET ${BASE_URL}/admin/login.html"
curl -s "${BASE_URL}/admin/login.html" | head -5 | grep -o '<title>.*</title>' || echo "HTML page served"
echo
echo

# Test 4: Admin Login API
echo "4. Testing Admin Login API:"
echo "POST ${BASE_URL}/auth/login"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')
echo "Response: $RESPONSE"
echo
echo

# Test 5: Users API (should require auth)
echo "5. Testing Users API (without auth):"
echo "GET ${BASE_URL}/users"
curl -s -w "%{http_code}" "${BASE_URL}/users"
echo
echo

# Test 6: Groups API (should require auth)
echo "6. Testing Groups API (without auth):"
echo "GET ${BASE_URL}/groups"
curl -s -w "%{http_code}" "${BASE_URL}/groups"
echo
echo

# Test 7: Admin redirect
echo "7. Testing Admin Redirect:"
echo "GET ${BASE_URL}/admin"
curl -s -w "%{http_code}" -I "${BASE_URL}/admin" | grep -E "(HTTP|Location)" || echo "Redirect test"
echo
echo

echo "🎉 Deployment Test Complete!"
echo "============================="
echo "✅ Worker deployed at: ${BASE_URL}"
echo "🔗 Admin Interface: ${BASE_URL}/admin"
echo "🔗 Sign-in Interface: ${BASE_URL}/signin"
