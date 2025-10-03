#!/bin/bash
# Deploy homeserver stack to remote server via SSH

# Configuration
SERVER="nyaptor@10.0.0.51"  # Set via env or change default
REMOTE_DIR=""

echo "🚀 Deploying to homeserver..."
echo "📡 Server: $SERVER"
echo "📂 Directory: $REMOTE_DIR"
echo ""

# SSH and deploy
ssh $SERVER << 'EOF'
  set -e  # Exit on error



  echo "🔄 Moving to repository ~/Repos/Installfest..."
  cd ~/Repos/Installfest || exit 1

  echo " 🔍 Where are we?"
  pwd && ls -la

  echo "📥 Pulling latest changes..."
  cd $REMOTE_DIR || exit 1
  git pull origin main

  echo "🔄 Moving to homeserver directory..."
  cd ~/homeserver || exit 1

  echo "🐳 Updating Docker images..."
  docker-compose pull

  echo "🔄 Restarting services..."
  docker-compose up -d

  echo ""
  echo "📊 Service Status:"
  docker-compose ps

  echo ""
  echo "✅ Deployment complete!"
EOF

echo ""
echo "🎉 Done! Services running on homeserver."
