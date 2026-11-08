# Expedientes Digitales BIM — Demo

Portal MVP de originación e integración del expediente digital fiduciario para Banco Inmobiliario Mexicano.

## Usuarios seed

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Superusuario | `super@bim.demo` | `super2026` |
| Ejecutivo Norte | `ejecutivo@bim.demo` | `bim2026` |
| Ejecutivo Norte 2 | `ejecutivo2@bim.demo` | `bim2026` |
| Cliente | correo + código de 6 dígitos (tras solicitud) | — |

## Flujo

1. Ejecutivo inicia sesión y crea un negocio (captura manual, sin Gestor Fiduciario).
2. Agrega participantes (PF/PM, nacional/extranjero) → se crea **una solicitud por participante**.
3. Copia el enlace de invitación o carga documentos él mismo.
4. Cliente abre su solicitud, sube el checklist y confirma datos.
5. Ejecutivo genera formatos prellenados y revisa el expediente por pestañas 0–6.

## Limitaciones de la demo

- INE: enlace al sitio oficial del INE (sin scraping ni API inventada).
- Facial y listas negras: placeholders “próximamente / sin proveedor”.
- OCR: extracción mock editable a partir del tipo de documento.
- Prefill: HTML editable de los formatos seleccionados (referencias PDF en `/fuentes`).

## Desarrollo

```bash
npm install
npm run dev
```
