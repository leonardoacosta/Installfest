#!/bin/bash
# Type Check Script
# Run TypeScript compiler or .NET build depending on file type

FILE="$1"

if [ -z "$FILE" ]; then
    echo "No file provided"
    exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Check if it's a TypeScript file
if echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
    echo "Type checking TypeScript..."
    npx tsc --noEmit 2>&1 | head -20 || true
fi

# Check if it's a C# file
if echo "$FILE" | grep -qE '\.cs$'; then
    echo "Building .NET project..."
    dotnet build --no-restore 2>&1 | head -30 || true
fi
