# Librería Rubén Darío — Especificación de Carga Masiva de Productos (Bulk Import)

> **Documento técnico para desarrolladores, integradores y agentes de IA.**
> Detalla el formato, los esquemas de datos, endpoints y ejemplos para generar archivos de importación masiva de productos en la base de datos de **Librería Rubén Darío**.

---

## 1. Endpoints y Autenticación

| Parámetro | Detalle |
| :--- | :--- |
| **URL (Desarrollo)** | `http://localhost:5000/v1/products/import/massive` |
| **URL (Producción)** | `https://api.libreriard.com.ar/v1/products/import/massive` |
| **Método HTTP** | `POST` |
| **Permisos** | Requiere autenticación de usuario **STAFF** (`ADMIN` o `EMPLOYEE`). |
| **Header de Autorización** | `Authorization: Bearer <access_token>` |
| **Content-Type** | `multipart/form-data` (archivo adjunto) o `application/json` (cuerpo directo) |

---

## 2. Métodos de Carga Soportados

El endpoint acepta dos vías de envío:

### Vía A: Archivo `multipart/form-data`
Se envía un archivo bajo el campo de formulario `file`:
- **JSON (`.json`)**: Array de objetos de productos.
- **Excel (`.xlsx`, `.xls`)**: Libro de Excel con columnas estándar.
- **CSV (`.csv`)**: Archivo delimitado por comas.

### Vía B: Cuerpo JSON directo `application/json`
Se envía el array de productos en el cuerpo de la petición:
```json
{
  "products": [
    { "name": "Cuaderno Gloria A4 84h", ... }
  ]
}
```
*(También se admite directamente un array raíz `[ { ... }, { ... } ]`).*

---

## 3. Identificación y Actualización (Upsert)

Para cada ítem, el motor de importación decide si **actualiza** un producto existente o **crea** uno nuevo:
1. Si se proporciona `id` y coincide con un producto existente en la base de datos, se actualiza dicho producto.
2. Si no se proporciona `id` (o no existe) pero se proporciona `barcode` y coincide con un producto en la base de datos, se actualiza ese producto.
3. Si ni `id` ni `barcode` coinciden con un producto existente, se genera un nuevo UUIDv7 y se inserta el producto.

---

## 4. Esquema de Datos de Productos (JSON)

Cada objeto de producto soporta los siguientes campos:

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Sí** | Nombre comercial del producto (máx. 250 caracteres). |
| `id` | `string` (UUIDv7) | No | Identificador único RFC 9562 UUIDv7. Si se omite, el sistema genera uno nuevo. |
| `description` | `string` | No | Descripción detallada, especificaciones o notas. |
| `barcode` | `string` | No | Código de barras (EAN-13, UPC, etc.) para lectores ópticos y escáneres. |
| `retailPrice` | `number \| null` | No | Precio base minorista al público en Pesos Argentinos (ARS). Debe ser $\ge 0$. |
| `wholesalePrice` | `number \| null` | No | Precio base mayorista en Pesos Argentinos (ARS). Debe ser $\ge 0$. |
| `retailPriceTiers` | `array` | No | Escalas de descuentos minoristas por volumen (ver sección 4.1). |
| `subTypes` | `array` | No | Variantes del producto (colores, tamaños, etc. Ver sección 4.2). |
| `supplier` | `string` | No | Nombre del proveedor, distribuidor o editorial. |
| `categories` | `string[]` | No | Categorías asignadas (ej: `["Escolar", "Cuadernos"]`). |
| `tags` | `string[]` | No | Etiquetas de búsqueda (ej: `["cuadriculado", "a4", "tapa dura"]`). |
| `isActive` | `boolean` | No | Estado de visibilidad (por defecto `true`). Si es `false`, no aparece en catálogos. |

---

### 4.1. Escalas Minoristas por Cantidad (`retailPriceTiers`)
Permite aplicar precios unitarios diferenciales automáticos cuando el cliente lleva a partir de cierta cantidad de unidades en una orden minorista:

```json
"retailPriceTiers": [
  {
    "minQuantity": 5,
    "unitPrice": 4800
  },
  {
    "minQuantity": 10,
    "unitPrice": 4200
  }
]
```

*Regla:* `minQuantity` debe ser un entero $> 1$, y `unitPrice` debe ser menor al precio unitario base.

---

### 4.2. Variantes / Subtipos (`subTypes`)
Permite registrar sub-opciones del mismo producto (como color, rayado, formato):

```json
"subTypes": [
  {
    "id": "var-01",
    "name": "Rayado - Azul",
    "sku": "CUAD-GLO-A4-RAY-AZ",
    "priceModifier": 0,
    "barcode": "779123456701"
  },
  {
    "id": "var-02",
    "name": "Cuadriculado - Rojo",
    "sku": "CUAD-GLO-A4-CUA-RO",
    "priceModifier": 200,
    "barcode": "779123456702"
  }
]
```

---

## 5. Formato de Archivo Excel / CSV

Si se importa a través de Excel (`.xlsx`) o CSV, la primera fila debe contener los siguientes encabezados exactos:

| Columna | Nombre de Cabecera | Ejemplo |
| :---: | :--- | :--- |
| A | `ID (Opcional)` | *(Vacío o UUIDv7)* |
| B | `Nombre *` | Resaltador Filgo Lighter |
| C | `Código de Barras` | 7791234560012 |
| D | `Precio Minorista` | 1250 |
| E | `Precio Mayorista` | 890 |
| F | `Proveedor` | Filgo Argentina S.A. |
| G | `Categorías (coma)` | Librería, Oficina, Marcadores |
| H | `Etiquetas (coma)` | fluorescente, pastel, punta biselada |
| I | `Activo (SI/NO)` | SI |
| J | `Descripción` | Resaltador con punta biselada de 2 a 5mm. |

---

## 6. Ejemplo Completo de Archivo JSON Masivo

A continuación, un ejemplo listo para ser consumido por un agente o script para importar miles de artículos:

```json
[
  {
    "name": "Cuaderno Rivadavia Tapa Dura 50 Hojas Rayado",
    "description": "Cuaderno clásico de tapas duras forradas, 50 hojas de papel grueso 88g.",
    "barcode": "7791234500018",
    "retailPrice": 3850,
    "wholesalePrice": 2900,
    "retailPriceTiers": [
      { "minQuantity": 5, "unitPrice": 3500 },
      { "minQuantity": 10, "unitPrice": 3200 }
    ],
    "supplier": "Ángel Estrada y Cía.",
    "categories": ["Escolar", "Cuadernos"],
    "tags": ["tapa dura", "rayado", "abc"],
    "isActive": true
  },
  {
    "name": "Bolígrafo BIC Cristal Azul Trazo Fino",
    "description": "Caja x 50 unidades o sueltos. Punta de tungsteno 0.8mm.",
    "barcode": "70330129654",
    "retailPrice": 450,
    "wholesalePrice": 310,
    "retailPriceTiers": [
      { "minQuantity": 12, "unitPrice": 400 },
      { "minQuantity": 50, "unitPrice": 340 }
    ],
    "supplier": "BIC Argentina",
    "categories": ["Librería", "Escritura"],
    "tags": ["bic", "boligrafo", "trazo fino", "azul"],
    "isActive": true
  },
  {
    "name": "Carpeta Escolar N°3 3 Anillos Fibra Negra",
    "description": "Carpeta clásica con 3 anillos reforzados y lomo personalizable.",
    "barcode": "7798123400031",
    "retailPrice": 5200,
    "wholesalePrice": 3950,
    "subTypes": [
      { "id": "negro", "name": "Color Negro", "sku": "CARP-3A-NEG", "priceModifier": 0 },
      { "id": "azul", "name": "Color Azul", "sku": "CARP-3A-AZU", "priceModifier": 0 }
    ],
    "supplier": "Distribuidora San Martín",
    "categories": ["Escolar", "Carpetas"],
    "tags": ["anillos", "numero 3", "archivo"],
    "isActive": true
  }
]
```

---

## 7. Respuesta de la API

La API procesa los productos en lotes (*batches*) de 200 usando operaciones masivas atómicas de MongoDB (`bulkWrite`).
La respuesta responde con el formato estándar `ApiResponse`:

```json
{
  "success": true,
  "message": "Carga masiva completada: 250 insertados, 15 actualizados.",
  "data": {
    "total": 265,
    "inserted": 250,
    "updated": 15,
    "errors": []
  }
}
```

Si algún ítem individual tiene errores (por ejemplo, falta de nombre), se reportará en el array `errors` con el índice correspondiente y no interrumpirá el procesamiento del resto del lote.

