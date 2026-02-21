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

# Essayer différents chemins possibles
if [ -f "/app/dist/main.js" ]; then
    echo "✅ Lancement: node /app/dist/main.js"
    exec node /app/dist/main.js
elif [ -f "/app/packages/server/dist/main.js" ]; then
    echo "✅ Lancement: node /app/packages/server/dist/main.js"
    exec node /app/packages/server/dist/main.js
elif [ -f "./dist/main.js" ]; then
    echo "✅ Lancement: node ./dist/main.js"
    exec node ./dist/main.js
else
    echo "❌ Impossible de trouver main.js!"
    exit 1
fi