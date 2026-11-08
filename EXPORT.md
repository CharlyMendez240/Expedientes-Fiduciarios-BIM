# Export MVP — Expedientes Digitales BIM

Exportado desde el worker `bc-fd640101-acb5-51d7-aebb-3ca54623b999` (sin `node_modules` ni `.next`).

## Instalar y arrancar

```bash
cd /cursor/stores/self/internal/portal-mvp-export
npm install
npm run dev
```

Abrir http://127.0.0.1:3000

## Acceso inicial

No hay contraseñas en este repositorio. Las cuentas de demostración solo se crean si el entorno define `BIM_SUPER_PASSWORD` y `BIM_EJECUTIVO_PASSWORD` (mínimo 12 caracteres). En Postgres se guarda el hash, no la contraseña.

## Publish-app

Intentado antes: falló porque el run greenfield no tenía repo GitHub enlazado. Luego el remoto `CharlyMendez240/Expedientes-Fiduciarios-BIM` existía pero este entorno no tenía auth de push.
