# Backend gratuito del Libro de Reclamaciones Virtual (Google Apps Script)

El formulario de `/libro-de-reclamaciones` necesita un lugar gratis donde guardar
los reclamos. Se usa Google Apps Script (gratis, sin tarjeta) atado a una hoja de
cálculo. Pasos:

## 1. Crear la hoja de cálculo

1. Crea un Google Sheet nuevo (puede ser el mismo que usarás para el catálogo, en
   una pestaña separada, o uno dedicado).
2. Crea una pestaña llamada exactamente `Reclamos`.
3. En la fila 1, agrega estos encabezados (uno por columna):

```
Fecha | Codigo | Tipo | Nombre | Documento | Domicilio | Telefono | Correo | Apoderado | TipoBien | DescripcionBien | Monto | Detalle | Pedido
```

## 2. Crear el Apps Script

1. En el Sheet, ve a **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` y pega esto:

```javascript
function doPost(e) {
  const datos = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reclamos');
  const codigo = 'REC-' + Utilities.formatDate(new Date(), 'GMT-5', 'yyyyMMdd-HHmmss');

  sheet.appendRow([
    new Date(),
    codigo,
    datos.tipo,
    datos.nombre,
    datos.documento,
    datos.domicilio,
    datos.telefono,
    datos.correo,
    datos.apoderado || '',
    datos.tipoBien,
    datos.descripcionBien,
    datos.monto || '',
    datos.detalle,
    datos.pedido,
  ]);

  // TODO PENDIENTE: reemplazar por el correo real donde el negocio quiere
  // recibir la notificación de cada reclamo nuevo.
  MailApp.sendEmail(
    'reclamos@tu-dominio.pe',
    'Nuevo reclamo: ' + codigo,
    JSON.stringify(datos, null, 2)
  );

  if (datos.correo) {
    MailApp.sendEmail(
      datos.correo,
      'Confirmación de reclamo ' + codigo,
      'Hemos recibido tu ' + datos.tipo + '. Tu código de seguimiento es: ' + codigo
    );
  }

  return ContentService
    .createTextOutput(JSON.stringify({ codigo }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Guarda el proyecto (ícono de disquete).

## 3. Publicar como Web App

1. Clic en **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. "Ejecutar como": tu cuenta.
4. "Quién tiene acceso": **Cualquier usuario** (necesario para que el formulario
   público pueda enviar datos).
5. Clic en **Implementar**, autoriza los permisos que pida Google (envío de
   correo y acceso a la hoja).
6. Copia la URL que termina en `/exec`.

## 4. Conectar con el sitio

Pega esa URL en [src/consts.ts](../src/consts.ts), en `RECLAMOS.appsScriptUrl`.
Mientras ese campo esté vacío, el formulario se muestra pero no permite enviar
(se ve un aviso de "vista previa" en su lugar).

## Notas

- Es 100% gratis: no requiere activar facturación en Google Cloud ni tarjeta.
- Los límites de envío de correo de una cuenta Gmail normal (100/día) son
  generosos para el volumen esperado de reclamos de una tienda chica/mediana.
- Cada vez que se edite el código del Apps Script hay que crear una **nueva
  implementación** (o editar la existente) para que los cambios se reflejen en
  la URL publicada.
