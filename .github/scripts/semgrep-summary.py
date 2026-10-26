"""Resume el reporte de Semgrep en el resumen del job y falla si hay hallazgos criticos (ERROR)."""
import json
import os
import sys

report_path = sys.argv[1] if len(sys.argv) > 1 else "semgrep.json"
with open(report_path, encoding="utf-8") as report_file:
    report = json.load(report_file)

results = report.get("results", [])
by_severity = {"ERROR": 0, "WARNING": 0, "INFO": 0}
for result in results:
    severity = result["extra"].get("severity", "INFO")
    by_severity[severity] = by_severity.get(severity, 0) + 1

critical = by_severity.get("ERROR", 0)
lines = [
    "## Analisis SAST (Semgrep)",
    "",
    f"Archivos analizados: **{len(report.get('paths', {}).get('scanned', []))}**",
    "",
    "| Severidad | Hallazgos |",
    "| --- | --- |",
    *[f"| {severity} | {count} |" for severity, count in by_severity.items()],
    "",
    "**Resultado:** " + ("FALLA: hay hallazgos criticos (ERROR) que corregir." if critical else "APROBADO: sin hallazgos criticos."),
]
if results:
    lines += ["", "| Severidad | Regla | Archivo |", "| --- | --- | --- |"]
    for result in results:
        rule = result["check_id"].split(".")[-1]
        lines.append(f"| {result['extra'].get('severity')} | `{rule}` | `{result['path']}:{result['start']['line']}` |")

summary = "\n".join(lines) + "\n"
print(summary)
summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
if summary_path:
    with open(summary_path, "a", encoding="utf-8") as summary_file:
        summary_file.write(summary)

sys.exit(1 if critical else 0)
