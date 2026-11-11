# App serverless: Pima Indians Diabetes

- Base de datos: Neon (PostgreSQL serverless). Script: db/script.sql
- Funciones serverless: Vercel Functions (api/pacientes.js, api/estadisticas.js)
- Página web: index.html (Vercel), con buscador por ID, filtros, tabla y gráficas

Variable de entorno requerida en Vercel: DATABASE_URL (cadena de conexión de Neon)
