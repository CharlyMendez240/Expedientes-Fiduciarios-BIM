# Expedientes Digitales BIM — Demo

Portal MVP de originación e integración del expediente digital fiduciario para Banco Inmobiliario Mexicano.

## Acceso inicial

No hay contraseñas ni correos de personal en este repositorio. Una cuenta de prueba solo se crea si el entorno define a la vez el correo y la contraseña: `BIM_SUPER_EMAIL` con `BIM_SUPER_PASSWORD`, o `BIM_EJECUTIVO_EMAIL` con `BIM_EJECUTIVO_PASSWORD`. La contraseña debe tener al menos 12 caracteres y se guarda solo como hash. El cliente entra con su correo y un código de un solo uso que no queda guardado en el correo simulado.

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
