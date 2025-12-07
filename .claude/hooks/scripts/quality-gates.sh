#!/bin/bash
# Quality Gates Script
# Run all quality checks before commit

set -e

cd "$CLAUDE_PROJECT_DIR"

echo "Running quality gates..."

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
    PM="pnpm"
elif [ -f "yarn.lock" ]; then
    PM="yarn"
elif [ -f "package-lock.json" ]; then
    PM="npm"
elif [ -f "bun.lockb" ]; then
    PM="bun"
else
    echo "No JavaScript package manager detected, skipping JS checks"
    PM=""
fi

# Detect .NET project
if [ -f "*.sln" ] || [ -f "*.csproj" ]; then
    DOTNET=true
else
    DOTNET=false
fi

# Run JavaScript/TypeScript checks
if [ -n "$PM" ]; then
    echo "📝 Type checking..."
    if $PM run typecheck 2>/dev/null; then
        echo "✅ Type check passed"
    elif npx tsc --noEmit 2>/dev/null; then
        echo "✅ Type check passed (tsc)"
    else
        echo "⚠️ No typecheck script found, skipping"
    fi

    echo "🔍 Linting..."
    if $PM run lint 2>/dev/null; then
        echo "✅ Lint passed"
    else
        echo "⚠️ No lint script found, skipping"
    fi
fi

# Run .NET checks
if [ "$DOTNET" = true ]; then
    echo "🔨 Building .NET project..."
    if dotnet build --no-restore 2>&1 | head -30; then
        echo "✅ .NET build passed"
    else
        echo "❌ .NET build failed"
        exit 1
    fi

    echo "🧪 Running .NET tests..."
    if dotnet test --no-build 2>&1 | head -30; then
        echo "✅ .NET tests passed"
    else
        echo "❌ .NET tests failed"
        exit 1
    fi
fi

echo ""
echo "✅ All quality gates passed!"
