"""Convierte diabetes.csv (Pima Indians Diabetes Database) en script.sql para PostgreSQL/Neon.
Uso: python generar_script.py diabetes.csv > script.sql
"""
import csv, sys

COLS = [  # (columna del CSV, columna en la BD, tipo de conversión)
    ("Pregnancies", "pregnancies", int),
    ("Glucose", "glucose", int),
    ("BloodPressure", "blood_pressure", int),
    ("SkinThickness", "skin_thickness", int),
    ("Insulin", "insulin", int),
    ("BMI", "bmi", float),
    ("DiabetesPedigreeFunction", "diabetes_pedigree_function", float),
    ("Age", "age", int),
    ("Outcome", "outcome", int),
]

with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
    filas = list(csv.DictReader(f))

out = sys.stdout
out.write("""-- =====================================================================
--  Script de base de datos: Pima Indians Diabetes Database
--  Motor: PostgreSQL serverless (Neon)
--  Fuente: Kaggle - uciml/pima-indians-diabetes-database (diabetes.csv)
--  Registros: %d (dataset completo)
-- =====================================================================

DROP TABLE IF EXISTS pacientes;

CREATE TABLE pacientes (
  id                          INTEGER      PRIMARY KEY,           -- ID asignado al cargar (1..%d)
  pregnancies                 SMALLINT     NOT NULL,              -- número de embarazos
  glucose                     SMALLINT     NOT NULL,              -- glucosa en plasma (mg/dL)
  blood_pressure              SMALLINT     NOT NULL,              -- presión diastólica (mm Hg)
  skin_thickness              SMALLINT     NOT NULL,              -- grosor del pliegue cutáneo (mm)
  insulin                     SMALLINT     NOT NULL,              -- insulina sérica a 2 horas (mu U/ml)
  bmi                         NUMERIC(4,1) NOT NULL,              -- índice de masa corporal
  diabetes_pedigree_function  NUMERIC(5,3) NOT NULL,              -- antecedentes familiares de diabetes
  age                         SMALLINT     NOT NULL,              -- edad (años)
  outcome                     SMALLINT     NOT NULL CHECK (outcome IN (0, 1))  -- 1 = diabetes, 0 = no
);

CREATE INDEX idx_pacientes_outcome ON pacientes (outcome);
CREATE INDEX idx_pacientes_age ON pacientes (age);

""" % (len(filas), len(filas)))

out.write("INSERT INTO pacientes (id, " + ", ".join(c[1] for c in COLS) + ") VALUES\n")
valores = []
for i, fila in enumerate(filas, start=1):
    vals = [str(i)] + [repr(conv(fila[col])) if conv is float else str(conv(fila[col])) for col, _, conv in COLS]
    valores.append("  (" + ", ".join(vals) + ")")
out.write(",\n".join(valores) + ";\n\n")
out.write("-- Verificación: debe dar %d\nSELECT COUNT(*) AS total_registros FROM pacientes;\n" % len(filas))
