#!/bin/bash
set -e

echo "=== Building Backend Services ==="
for dir in Backend-Admin Backend-Apprenant Backend-Formateur; do
    echo "-> Building $dir..."
    (cd "$dir" && chmod +x mvnw && ./mvnw clean package -DskipTests)
done

echo "=== Building Frontend Services ==="
for dir in "Service Admin" "Service Apprenant" "Service Formateur"; do
    echo "-> Building $dir..."
    (cd "$dir" && npm install && npm run build)
done

echo "=== All Builds Completed Successfully ==="
