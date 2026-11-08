# Export MVP — Expedientes Digitales BIM

Exportado desde el worker `bc-fd640101-acb5-51d7-aebb-3ca54623b999` (sin `node_modules` ni `.next`).

## Instalar y arrancar

```bash
cd /cursor/stores/self/internal/portal-mvp-export
npm install
npm run dev
```

Abrir http://127.0.0.1:3000

## Usuarios seed

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Superusuario | `super@bim.demo` | `super2026` |
| Ejecutivo Norte | `ejecutivo@bim.demo` | `bim2026` |
| Ejecutivo Norte 2 | `ejecutivo2@bim.demo` | `bim2026` |
| Cliente | correo + código de 6 dígitos (tras solicitud) | — |

## Publish-app

Intentado antes: falló porque el run greenfield no tenía repo GitHub enlazado. Luego el remoto `CharlyMendez240/Expedientes-Fiduciarios-BIM` existía pero este entorno no tenía auth de push.
