// Función serverless (Vercel): resúmenes para las gráficas.
// GET /api/estadisticas
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Totales generales
    const [resumen] = await sql`
      SELECT COUNT(*)::int                              AS total,
             COUNT(*) FILTER (WHERE outcome = 1)::int   AS con_diabetes,
             ROUND(AVG(glucose), 1)::float              AS glucosa_promedio,
             ROUND(AVG(bmi), 1)::float                  AS imc_promedio,
             ROUND(AVG(age), 1)::float                  AS edad_promedio
      FROM pacientes`;

    // Porcentaje de diabetes por rango de edad
    const porEdad = await sql`
      SELECT CASE
               WHEN age < 30 THEN '21-29'
               WHEN age < 40 THEN '30-39'
               WHEN age < 50 THEN '40-49'
               WHEN age < 60 THEN '50-59'
               ELSE '60+'
             END AS rango,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE outcome = 1)::int AS con_diabetes
      FROM pacientes
      GROUP BY rango
      ORDER BY rango`;

    // Porcentaje de diabetes por rango de glucosa (los ceros son datos faltantes del dataset)
    const porGlucosa = await sql`
      SELECT CASE
               WHEN glucose = 0 THEN 'Sin dato'
               WHEN glucose < 100 THEN '<100'
               WHEN glucose < 126 THEN '100-125'
               WHEN glucose < 160 THEN '126-159'
               ELSE '160+'
             END AS rango,
             MIN(glucose) AS orden,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE outcome = 1)::int AS con_diabetes
      FROM pacientes
      GROUP BY rango
      ORDER BY orden`;

    return res.status(200).json({ resumen, porEdad, porGlucosa });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error consultando la base de datos.' });
  }
}
