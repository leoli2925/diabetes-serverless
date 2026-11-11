// Función serverless (Vercel): consulta la tabla "pacientes" en Neon.
// GET /api/pacientes?id=5                       -> un paciente por su ID
// GET /api/pacientes?outcome=1&edadMin=30&edadMax=50&pagina=1 -> lista filtrada (50 por página)
import { neon } from '@neondatabase/serverless';

// La cadena de conexión se guarda como variable de entorno en Vercel (no en el código)
const sql = neon(process.env.DATABASE_URL);

const POR_PAGINA = 50;

// Convierte un parámetro a entero; devuelve null si no es válido
const entero = (v) => (v !== undefined && v !== '' && /^\d+$/.test(String(v)) ? Number(v) : null);

export default async function handler(req, res) {
  try {
    const { id, outcome, edadMin, edadMax, pagina } = req.query;

    // 1) Búsqueda por ID principal
    if (id !== undefined && id !== '') {
      const idNum = entero(id);
      if (idNum === null) return res.status(400).json({ error: 'El ID debe ser un número entero.' });
      const filas = await sql`SELECT * FROM pacientes WHERE id = ${idNum}`;
      if (filas.length === 0) return res.status(404).json({ error: `No existe el paciente con ID ${idNum}.` });
      return res.status(200).json({ total: 1, pagina: 1, datos: filas });
    }

    // 2) Lista con filtros opcionales (valores nulos = sin filtro)
    const out = outcome === '0' || outcome === '1' ? Number(outcome) : null;
    const min = entero(edadMin);
    const max = entero(edadMax);
    const pag = Math.max(1, entero(pagina) ?? 1);
    const desde = (pag - 1) * POR_PAGINA;

    const [{ total }] = await sql`
      SELECT COUNT(*)::int AS total FROM pacientes
      WHERE (${out}::smallint IS NULL OR outcome = ${out})
        AND (${min}::int IS NULL OR age >= ${min})
        AND (${max}::int IS NULL OR age <= ${max})`;

    const datos = await sql`
      SELECT * FROM pacientes
      WHERE (${out}::smallint IS NULL OR outcome = ${out})
        AND (${min}::int IS NULL OR age >= ${min})
        AND (${max}::int IS NULL OR age <= ${max})
      ORDER BY id
      LIMIT ${POR_PAGINA} OFFSET ${desde}`;

    return res.status(200).json({ total, pagina: pag, porPagina: POR_PAGINA, datos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error consultando la base de datos.' });
  }
}
