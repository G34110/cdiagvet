#!/bin/sh

echo "=========================================="
echo "🚀 SCRIPT DE DÉMARRAGE DEBUG"
echo "=========================================="
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo "Current directory: $(pwd)"
echo ""

echo "📂 CONTENU DE /app:"
ls -la /app
echo ""

echo "📂 CONTENU DE /app/dist (si existe):"
if [ -d "/app/dist" ]; then
    ls -la /app/dist/
    echo ""
    echo "🔍 RECHERCHE DE main.js:"
    find /app -name "main.js" 2>/dev/null || echo "❌ Aucun main.js trouvé!"
else
    echo "❌ Le dossier /app/dist n'existe pas!"
fi
echo ""

echo "📂 RECHERCHE DANS TOUT LE SYSTÈME:"
find / -name "main.js" 2>/dev/null | head -20
echo ""

echo "🌍 VARIABLES D'ENVIRONNEMENT:"
env | sort
echo ""

echo "=========================================="
echo "🚀 TENTATIVE DE LANCEMENT"
echo "=========================================="

# NestJS build preserves src/ structure, so main.js is in dist/src/
if [ -f "/app/dist/src/main.js" ]; then
    echo "✅ Lancement: node /app/dist/src/main.js"
    exec node /app/dist/src/main.js
elif [ -f "/app/dist/main.js" ]; then
    echo "✅ Lancement: node /app/dist/main.js"
    exec node /app/dist/main.js
else
    echo "❌ Impossible de trouver main.js!"
    find /app -name "main.js" 2>/dev/null
    exit 1
fi