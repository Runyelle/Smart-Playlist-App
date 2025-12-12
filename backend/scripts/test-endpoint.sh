#!/bin/bash

# Test script to verify the transitions endpoint is accessible
# Usage: ./scripts/test-endpoint.sh

echo "🔍 Testing backend endpoints..."
echo ""

# Test health endpoint
echo "1. Testing /health endpoint:"
curl -s http://localhost:4000/health | jq '.' || echo "❌ Health check failed - is the server running?"
echo ""

# Test transitions/generate without auth (should return 401, not 404)
echo "2. Testing POST /transitions/generate without auth (should return 401):"
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4000/transitions/generate \
  -H "Content-Type: application/json" \
  -d '{"trackA":{"id":"test1","name":"Track A"},"trackB":{"id":"test2","name":"Track B"}}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
  echo "✅ Correctly returns 401 (authentication required)"
  echo "$body" | jq '.'
elif [ "$http_code" = "404" ]; then
  echo "❌ Returns 404 - Route not found! Server may be running old code."
  echo "   Solution: Run 'npm run build && npm run dev'"
else
  echo "⚠️  Returns $http_code (expected 401)"
  echo "$body" | jq '.' || echo "$body"
fi
echo ""

# Test transitions/status endpoint
echo "3. Testing GET /transitions/status/test-id (should return 404 for non-existent):"
response=$(curl -s -w "\n%{http_code}" http://localhost:4000/transitions/status/test-id)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "404" ]; then
  echo "✅ Correctly returns 404 (status not found)"
  echo "$body" | jq '.'
elif [ "$http_code" = "200" ]; then
  echo "⚠️  Returns 200 (unexpected - status exists?)"
  echo "$body" | jq '.'
else
  echo "⚠️  Returns $http_code"
  echo "$body" | jq '.' || echo "$body"
fi
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "If you see 404 errors, the server is likely running old code."
echo "Run: npm run build && npm run dev"

