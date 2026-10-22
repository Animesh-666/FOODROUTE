# Migration Map

Legacy public/pages and public/js → apps/web features. Routes/controllers → function handlers/services. MySQL models → Firestore repositories. Middleware validation → contracts plus backend authorization. Algorithms → routing-engine. Keep legacy code as a separate read-only reference; never run destructive schema initialization against retained data.
