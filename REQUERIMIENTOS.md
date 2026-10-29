# Requerimientos y Documentación de Arquitectura - RD POS System

## 1. Visión General del Proyecto

**RD POS System** es un sistema integral de Punto de Venta (POS), control de inventario, facturación y gestión comercial diseñado para negocios locales de librería y papelería (actualmente en producción para "Librería Rubén Darío").

### Premisa de Operación y Modelo de Despliegue
* **Modo Híbrido Local / Red LAN:** La aplicación opera levantando un servidor HTTP local (desarrollado sobre Node.js y Express) en el puerto `4000`.
* **Acceso Centralizado y Multi-Dispositivo:** La propia interfaz de la aplicación de escritorio (Electron) se ejecuta como cliente cargando la URL local `http://localhost:4000`. Simultáneamente, cualquier dispositivo (computadoras auxiliares, teléfonos celulares o tablets) conectado a la misma red local (LAN Wi-Fi o Ethernet) puede acceder a la interfaz y consumir todos los servicios ingresando a la dirección IP de la máquina anfitriona (`http://<IP_LOCAL>:4000`).
* **Autonomía Offline:** El motor de base de datos embebida SQLite (`better-sqlite3`) almacena toda la persistencia en el disco local de la máquina principal, permitiendo operar a máxima velocidad y de manera 100% independiente de internet.
* **Sincronización en la Nube:** Dispone de un canal asíncrono para respaldar productos e inventario hacia una API remota en la nube (`https://libreriard.onrender.com` / `http://localhost:5000`).

---

## 2. Requerimientos del Negocio y Funcionales (RF)

### 2.1. Gestión de Catálogo de Productos e Inventario
* **RF-01 (Registro y Mantenimiento de Productos):**
  * Alta, consulta, modificación y baja lógica (*soft delete* mediante bandera `deleted = 1`) de productos.
  * Atributos: ID único (UUID v7), Nombre, Descripción, Código de Barras, Stock físico, Proveedor asociado (`provider_id`), Imagen del producto, Precio Mayorista, Precio Minorista, fecha de creación, actualización y fecha de última actualización de precios (`price_updated_at`).
* **RF-02 (Sistema de Códigos de Barras):**
  * Soporte para lectura e ingreso de códigos estándar (EAN-13, CODE-128, etc.) vía escáner óptico o cámara.
  * Generación automatizada de códigos de barras internos bajo el formato `RD<YY><000000000>` (con prefijo del negocio, año corriente de dos dígitos y correlativo incremental formateado a 9 dígitos).
  * Control de duplicidad de códigos de barra para impedir colisiones.
* **RF-03 (Esquema de Precios en Centavos y Escalas de Descuento):**
  * Todos los valores monetarios se persisten como **números enteros en centavos** (ej. \$150.50 se almacena como `15050`) para eliminar errores de redondeo por aritmética de coma flotante.
  * **Dualidad de Precios:** Cada producto posee un precio mayorista (`price_major`) y un precio minorista (`price_minor`).
  * **Reglas de Descuento por Cantidad (Escala Minorista):** Tabla `minor_prices` vinculada a cada producto, donde se parametrizan hasta 4 condiciones de cantidad y su respectivo precio unitario bonificado (ej. a partir de 3 unidades \$900 c/u; a partir de 5 unidades \$800 c/u).
* **RF-03b (Historial de Precios y Auditoría Cronológica):**
  * Tabla `price_history` que almacena de forma inmutable cada actualización de precios minoristas o mayoristas.
  * Atributos auditados: ID, ID de producto (`product_id`), Tipo de precio (`minor` | `major`), Precio anterior en centavos (`old_price`), Precio nuevo en centavos (`new_price`), Diferencia monetaria (`difference`), Variación porcentual (`percentage_diff`) y Marca temporal (`created_at`).
  * Endpoint `GET /api/products/:id/price-history` y modal visual de historial para inspección rápida de fluctuaciones.
* **RF-04 (Búsqueda, Paginación y Ordenamiento Avanzado):**
  * Búsqueda por múltiples palabras clave (*multi-token matching*) en nombres de producto insensibles a mayúsculas/minúsculas (`COLLATE NOCASE`), descripción o código de barras.
  * Filtros por ID, código de barras, proveedor y estado de inventario (con stock, stock bajo, agotados).
  * Métodos de ordenamiento: Alfabético (A-Z / Z-A), Precio minorista (asc/desc), Precio mayorista (asc/desc), Stock (asc/desc), Fecha de creación y **Última actualización de precio** (`price_updated_at_desc` / `price_updated_at_asc`).
  * Paginación en servidor (`LIMIT` y `OFFSET`).

### 2.2. Gestión de Clientes y Proveedores
* **RF-05 (Administración de Clientes):**
  * CRUD de clientes: ID (UUID v7), Razón Social / Nombre, CUIL/CUIT, Email, Teléfono, Dirección fiscal/física.
  * Asignación de tipo de lista por defecto (`default_order_type`): `minor` (minorista) o `major` (mayorista).
* **RF-06 (Administración de Proveedores):**
  * Registro y listado de proveedores comerciales con ID, Nombre y prefijo asignado de códigos de barra.
  * Integridad referencial: al eliminar un proveedor, los productos asociados deben desvincularse (`provider_id = NULL`) sin perder el producto ni las ventas históricas.

### 2.3. Punto de Venta (POS) y Órdenes de Venta
* **RF-07 (Emisión de Órdenes de Venta y Experiencia Móvil POS):**
  * Flujo ágil de facturación en mostrador con selección de tipo de venta (Mayorista / Minorista) y cliente opcional.
  * **Diseño Adaptativo Móvil (Mobile POS):** Diagramación dinámica en una sola columna en pantallas `< 900px`, sustitución de tablas densas por tarjetas interactivas táctiles (`cart-card`) en pantallas de teléfono (`<= 640px`) con botones ergonómicos de cantidad (+ / -), subtotal visible y eliminación directa sin scroll horizontal.
  * Prevención de auto-zoom indeseado en dispositivos iOS y Android mediante inputs normalizados a 16px.
  * Escaneo o selección rápida de productos para incorporación al carrito de venta.
  * **Cálculo Automático de Descuentos:** En compras minoristas, el sistema analiza en tiempo real las reglas de escala (`minor_prices`) y aplica el precio promocional correspondiente si la cantidad del producto alcanza o supera el umbral configurado.
  * Desglose de importes: Precio base, descuentos aplicados, precio final, adelanto recibido (`advancement`) y saldo pendiente.
* **RF-08 (Métodos de Pago y Estados):**
  * Registro de forma de pago utilizada: Efectivo (`cash`), Transferencia (`transfer`), Tarjeta (`card`), Cuenta Corriente (`current_account`).
  * Estados de orden: Pendiente, Completada, Cancelada.
  * Numeración correlativa única de órdenes gestionada a través de metadatos del sistema (`orders-count`).
* **RF-09 (Comprobantes y Recibos de Venta):**
  * Generación de comprobante no válido como factura fiscal que consolida el detalle de artículos, precios unitarios, descuentos aplicados, subtotales, datos fiscales de la empresa (Librería Rubén Darío, CUIT 30714624411, Responsable Inscripto, datos bancarios para transferencia).
  * **Impresión Directa:** Modo `action=print` que envía el documento a la impresora del sistema operativo con formato optimizado.
  * **Descarga en PDF:** Modo `action=save` que genera un archivo PDF formal para archivo o envío digital.

### 2.4. Integración y Procesamiento Masivo con Hojas de Cálculo (Excel)
* **RF-10 (Exportación de Catálogos Excel):**
  * Generación de **Lista Interna de Precios** en formato `.xlsx` con columnas de ID, Código, Nombre, Proveedor, Precio Mayorista, Precio Minorista y las 4 columnas de condiciones de descuento y precios bonificados.
  * Generación de **Lista de Precios para Clientes** en formato `.xlsx` limpio y formateado para difusión comercial.
* **RF-11 (Importación Masiva de Precios):**
  * Carga de archivo Excel para actualización masiva de precios y escalas de descuento.
  * Ejecución dentro de una transacción de base de datos atómica y exclusiva para evitar inconsistencias o lecturas sucias durante el procesamiento.

### 2.5. Resguardo, Mantenimiento y Sincronización
* **RF-12 (Copias de Seguridad Automatizadas):**
  * Cron de respaldo horario (`0 * * * *`) que ejecuta un snapshot en caliente de la base de datos SQLite hacia el directorio de usuario (`userData/backups/`).
  * Política de retención rotativa con un máximo de 72 copias de seguridad (3 días de historial continuo), purgando automáticamente los archivos más antiguos.
* **RF-13 (Mantenimiento de Base de Datos):**
  * Función de desfragmentación y optimización de espacio en disco mediante comando `VACUUM`.
  * Descarga manual directa del archivo `data.db` para resguardos externos.
* **RF-14 (Sincronización en la Nube):**
  * Envío por lotes (*chunking* de 100 registros) de productos no sincronizados (`synchronized = 0`) hacia el backend remoto.
  * Autenticación contra servicio externo mediante credenciales y token JWT.
  * Marcado atómico de productos sincronizados (`synchronized = 1`) y control de estado de sincronización concurrente (*flag lock*).

### 2.6. Reportes y Analítica
* **RF-15 (Dashboard de Métricas):**
  * Visualización temporal de facturación diaria y volumen de ventas mediante gráficos de líneas interactivos.
  * Filtrado por rangos de fecha con persistencia de selección.

---

## 3. Requerimientos No Funcionales (RNF)

* **RNF-01 (Desempeño y Latencia Local):** Tiempo de respuesta menor a 50 ms para consultas de búsqueda de productos y creación de órdenes en la red local.
* **RNF-02 (Concurrencia y Atomicidad ACID):**
  * Acceso concurrente multi-dispositivo seguro a SQLite mediante el modo WAL (Write-Ahead Logging).
  * Transacciones estrictas para cualquier operación de escritura (inserción de órdenes con items y descuentos, importación masiva de listas, actualización de correlativos).
* **RNF-03 (Modularidad y Principio de Responsabilidad Única - SRP):**
  * Cada módulo, clase y archivo debe tener una única razón de cambio.
  * **Límite de tamaño estricto:** Ningún archivo ni clase debe exceder aproximadamente las 100 líneas de código útil, favoreciendo la legibilidad, mantenibilidad y desacoplamiento.
* **RNF-04 (Tipado Estricto y Calidad de Código):**
  * Migración total a **TypeScript** con configuración estricta (`strict: true`, sin `any` implícitos).
  * Validación de esquemas en tiempo de ejecución en entradas de API (Data Transfer Objects y validadores).
* **RNF-05 (Cobertura de Pruebas Automatizadas):**
  * Cobertura de pruebas unitarias y de integración para todas las capas críticas: dominio, repositorios, servicios de negocio, endpoints y componentes de UI.
  * Uso de herramientas modernas de testing (**Vitest**).
* **RNF-06 (Portabilidad y Empaquetado):**
  * Compatibilidad con Windows (instaladores Squirrel/Setup y binarios portables) manteniendo soporte estructural multiplataforma (macOS, Linux).
  * Empaquetado optimizado mediante **Electron Forge** y empaquetado de assets nativos.

---

## 4. Diagnóstico del Estado Actual y Deuda Técnica Detectada

Tras el análisis estático y dinámico del repositorio actual, se identificaron los siguientes puntos críticos a resolver durante la refactorización:

| Componente / Área | Problema Actual Detectado | Impacto en el Sistema |
| :--- | :--- | :--- |
| **Arquitectura de Servidor** | En `orders.router.js`, el endpoint `/receipt/:id` realiza una petición HTTP contra sí mismo (`fetch('http://localhost:4000/api/orders?id=...')`). | Ineficiencia severa, latencia innecesaria, consumo de sockets y riesgo de bloqueo por autorreferencia. |
| **Acoplamiento Electron-Express** | Se instancia `new BrowserWindow()` directamente dentro de `orders.router.js` para renderizar PDFs de recibos. | Si el servidor se consulta desde un dispositivo en la LAN, una petición web desencadena la creación de una ventana invisible de escritorio en el anfitrión; rompe la separación cliente-servidor. |
| **Persistencia en Rutas** | SQL embebido directamente en funciones de Express en `orders.router.js` y `customers.router.js` en lugar de repositorios. | Violación de SRP y PEAA; dificulta escribir pruebas unitarias sin levantar base de datos real. |
| **Duplicación de Archivos** | Duplicados idénticos en backend (`controllerResponse.js` y `response.controller.js`) y frontend (`GenericView.js` y `generic.view.js`). | Confusión en importaciones, divergencia silenciosa de código. |
| **Frontend Monolítico** | Vistas (`orders.create.view.js` con 518 líneas, `product.view.js` con 283 líneas) que mezclan HTML como string, eventos, llamadas de red, estado en `localStorage` y cálculo de descuentos. | Mantenimiento sumamente frágil; violación flagrante del límite de 100 líneas y de SRP. |
| **Dependencias en desuso** | `postgres` y `keytar` presentes en dependencias pero sin uso activo o vinculadas a prototipos obsoletos. | Sobrecarga de instalación y aumento innecesario del tamaño del bundle. |
| **Scripts manuales en `src/public/lib`** | Librerías pesadas (`zxing.min.js`, `chart.umd.min.js`, `navigo.min.js`, `tom-select`) copiadas como archivos estáticos gigantes (hasta 360.000 líneas). | Imposibilidad de aplicar tree-shaking, dependencias desactualizadas sin gestión de versiones. |
| **Falta de Tests** | No existe ningún archivo ni infraestructura de pruebas automáticas en todo el repositorio. | Alta probabilidad de regresiones en lógica financiera (descuentos, montos, centavos). |

---

## 5. Decisiones de Diseño y Patrones Arquitectónicos

Para lograr un sistema robusto, escalable, tipado y mantenible, se adopta una arquitectura en capas fundamentada en las directrices de **PEAA (Patterns of Enterprise Application Architecture)** de Martin Fowler y los patrones de diseño clásicos de **GoF (Gang of Four)**, asegurando que cada componente se encapsule en clases con alta cohesión y bajo acoplamiento.

### 5.1. Arquitectura en Capas (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                 PRESENTACIÓN / CLIENTE                      │
│   (Electron Host / Vite SPA / Componentes Web / UI Views)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    CONTROLADORES / API                      │
│        (Express Routers / DTOs / Request Handlers)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Invocación tipada
┌──────────────────────────────▼──────────────────────────────┐
│                 CAPA DE APLICACIÓN / SERVICIOS              │
│ (Service Layer: OrderService, ProductService, SyncService)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Orquestación de Dominio
┌──────────────────────────────▼──────────────────────────────┐
│                      CAPA DE DOMINIO                        │
│   (Entities: Product, Order, Customer / Value Objects: Money)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Interfaces de Persistencia
┌──────────────────────────────▼──────────────────────────────┐
│                   INFRAESTRUCTURA / DATOS                   │
│   (Repositories SQLite, Database Client, Cron, PDF Maker)   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2. Patrones de Arquitectura Empresarial (PEAA - Martin Fowler)

1. **Repository Pattern (Repositorio):**
   * Media entre las capas de dominio/aplicación y la persistencia de datos (SQLite).
   * Cada entidad (`ProductRepository`, `OrderRepository`, `CustomerRepository`, `ProviderRepository`) expone métodos con intención semántica (`findById`, `save`, `findAll`, `delete`) ocultando las sentencias SQL.
2. **Service Layer (Capa de Servicios):**
   * Define los límites de la aplicación y coordina las operaciones del caso de uso.
   * Maneja las transacciones y la orquestación (ej. `CreateOrderService` verifica stock, calcula descuentos mediante el modelo de dominio, persiste la orden e ítems en una transacción y despacha eventos).
3. **Domain Model (Modelo de Dominio Rico):**
   * Se sustituyen los objetos anémicos por clases con lógica de negocio encapsulada.
   * La entidad `Order` contiene las reglas para verificar umbrales de descuento, acumular subtotales y validar pagos, en lugar de dispersar fórmulas matemáticas en controladores o vistas.
4. **Value Object (Objeto de Valor):**
   * Creación de clases inmutables para conceptos del dominio:
     * `Money`: Encapsula el valor en centavos, operaciones aritméticas seguras y formateo monetario internacionalizado (`$1.250,00`).
     * `Barcode`: Encapsula la validación sintáctica de códigos EAN o internos `RD<YY><000000000>`.
     * `Cuil`: Encapsula la validación de formato fiscal.
5. **Data Transfer Object (DTO):**
   * Objetos planos para transferir datos a través de los límites de red entre controladores y clientes, desacoplando los esquemas de base de datos de las respuestas HTTP.
6. **Data Mapper / Table Data Gateway:**
   * Mapeadores encargados de transformar las tuplas de SQLite en instancias de entidades de dominio y viceversa.
7. **Unit of Work / Transaction Script:**
   * Envoltorios de transacciones (`database.transaction()`) administrados a nivel de servicio para garantizar consistencia atómica sin fugar lógica de infraestructura a los controladores.

### 5.3. Patrones de Diseño GoF (Gang of Four)

1. **Patrones Creacionales:**
   * **Singleton:** Aplicado a la instancia central de conexión a la base de datos SQLite y al bus de eventos de la aplicación.
   * **Factory Method:** Factorías para la creación de comprobantes de pago (`ReceiptFactory`), generadores de listas Excel (`WorkbookFactory`) y entidades complejas.
2. **Patrones Estructurales:**
   * **Adapter (Adaptador):**
     * Adaptador para el generador de PDF (`PdfGeneratorAdapter`), independizando el motor de impresión del controlador HTTP.
     * Adaptador para el escáner de códigos de barra (`BarcodeScannerAdapter`), permitiendo intercambiar ZXing o librerías de hardware.
   * **Facade (Fachada):**
     * `DatabaseBackupFacade`: Oculta la complejidad de sincronización de snapshots, validación de carpetas, desfragmentación (`VACUUM`) y rotación de 72 archivos.
     * `CloudSyncFacade`: Oculta la segmentación en chunks, autenticación y manejo de errores con la nube.
3. **Patrones de Comportamiento:**
   * **Strategy (Estrategia):**
     * Cálculo de precios y descuentos (`DiscountPricingStrategy`): Estrategia Mayorista pura vs. Estrategia Minorista por escalas de cantidad.
     * Estrategia de formateo y exportación de listas de precios (Interna vs. Clientes).
   * **Observer / Publish-Subscribe:**
     * Emisión de eventos del sistema (ej. `OrderCreated`, `ProductSynchronized`) para disparar logs, actualización de métricas o alertas visuales sin acoplamiento directo.
   * **Command (Comando):**
     * Encapsulamiento de tareas programadas de mantenimiento y lotes de migración de datos.

### 5.4. Regla de Oro de Mantenibilidad: SRP y Límite de ~100 Líneas

Para garantizar que el sistema sea comprensible, testeable y fácilmente extensible por cualquier desarrollador:
* **Principio de Responsabilidad Única (SRP):** Cada clase debe resolver exactamente un aspecto del dominio o de la infraestructura.
* **Granularidad Fina (~100 Líneas de Código):**
  * Controladores: Solo parsean la petición HTTP, invocan al servicio correspondiente y devuelven el DTO resultante (~40-70 líneas).
  * Repositorios: Contienen únicamente las consultas parametrizadas de su entidad (~60-90 líneas).
  * Entidades: Contienen sus campos, validaciones de invariantes y métodos de dominio específicos (~60-90 líneas).
  * Vistas y Componentes: Divididos en componentes atómicos (ej. Header, ProductList, DiscountSummary, PaymentSelector) en lugar de vistas mastodónticas de 500 líneas.

---

## 6. Stack Tecnológico Modernizado

| Capa / Función | Tecnología Actual | Tecnología Objetivo Modernizada | Justificación del Cambio |
| :--- | :--- | :--- | :--- |
| **Gestor de Paquetes** | npm (`package-lock.json`) | **PNPM** (`pnpm-lock.yaml`) | Instalaciones ultra-rápidas, almacenamiento eficiente por enlaces duros, aislamiento estricto de dependencias fantasma. |
| **Lenguaje** | JavaScript (CommonJS/ESM mixto) | **TypeScript** (Strict mode) | Tipado estático de punta a punta, eliminación de errores en runtime, autocompletado y refactorización segura. |
| **Entorno de Escritorio**| Electron + Forge | **Electron** + **Electron Forge** | Mantiene compatibilidad con empaquetado nativo Windows, menús y fuses de seguridad configurados. |
| **Servidor Web Local** | Express (JS artesanal) | **Express** estructurado con **TypeScript** | Soporte robusto y estándar para atender peticiones concurrentes en la LAN local de manera ligera. |
| **Base de Datos Local** | `better-sqlite3` (SQLite) | **`better-sqlite3`** con Repositorios TS | Excelente rendimiento sincrónico en Node.js, transacciones atómicas de baja latencia y confiabilidad industrial. |
| **Herramienta Frontend** | Vanilla JS con scripts globales | **Vite** + **TypeScript** | HMR instantáneo, empaquetado optimizado, tree-shaking, gestión de librerías vía npm en lugar de lib/. |
| **Framework de Pruebas**| Ninguno | **Vitest** | Ejecución ultra-rápida nativa de TypeScript, suite completa de tests unitarios, de mocks y de integración. |
| **Generación de Archivos**| `exceljs`, `pdfmake` | `exceljs`, `pdfmake` | Se conservan los motores probados de generación de Excel y PDF, pero encapsulados bajo adaptadores orientados a objetos. |

---

## 7. Plan de Ejecución y Hoja de Ruta

1. **Fase 1: Transición al Gestor de Paquetes PNPM**
   * Configuración de `.npmrc` con configuraciones recomendadas.
   * Limpieza de dependencias huérfanas (`postgres`, scripts obsoletos).
   * Generación de `pnpm-lock.yaml` determinista.
2. **Fase 2: Infraestructura TypeScript y Vite**
   * Configuración de `tsconfig.json` para backend (Node/Electron) y frontend (DOM/Vite).
   * Configuración de Vite con salida integrada servida por Express en `/public` o en modo dev proxy.
   * Configuración del entorno de pruebas con Vitest.
3. **Fase 3: Refactorización del Backend en Clases y Capas (PEAA/GoF)**
   * Capa de Dominio: Entidades (`Product`, `Order`, `Customer`, `Provider`) y Value Objects (`Money`, `Barcode`).
   * Capa de Persistencia: Implementación de repositorios tipados (< 100 líneas por archivo).
   * Capa de Servicios: Orquestación de casos de uso y transacciones atómicas.
   * Capa de Controladores y Rutas: Refactorización de rutas desacopladas de Electron.
4. **Fase 4: Refactorización Modular del Frontend**
   * Descomposición de vistas monolíticas en componentes modulares que cumplan el estándar de ~100 líneas.
   * Migración de llamadas de red a un cliente de API tipado con DTOs.
5. **Fase 5: Cobertura de Tests Unitarios e Integración**
   * Pruebas exhaustivas de cálculo de precios, umbrales de descuento, generación de correlativos y validaciones.
6. **Fase 6: Verificación de Empaquetado y Distribución**
   * Pruebas de compilación completa (`pnpm run build`), empaquetado con Electron Forge (`pnpm run make`) y validación de ejecución en red local.

---

## 8. Compatibilidad Nativa y Pipeline de Build (Node ABI 140 vs 137)

### 8.1. Diagnóstico del Error de Módulos Nativos
Al utilizar módulos de C++ nativos como `better-sqlite3` en conjunto con Electron:
* El entorno anfitrión Node.js (v24) utiliza `NODE_MODULE_VERSION 137`.
* El runtime de Electron (v39) utiliza `NODE_MODULE_VERSION 140`.
* Si el módulo nativo se compila para el Node anfitrión, Electron arroja:
  `UnhandledPromiseRejectionWarning: Error: The module 'better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 137. This version of Node.js requires NODE_MODULE_VERSION 140.`

### 8.2. Solución de Arquitectura Implementada
1. **Rebuild Nativo Automatizado:**
   * Se integró el script `rebuild:electron`: `electron-rebuild -f -w better-sqlite3`.
   * Se vinculó a los hooks de ciclo de vida en `package.json`: `prestart`, `prepackage`, `premake`, `prepublish`.
   * Garantiza que antes de cualquier ejecución o empaquetado de Electron, el módulo nativo esté compilado para ABI 140.
2. **Ejecución Unificada de Tests (Vitest sobre Electron Node):**
   * En lugar de forzar recompilaciones alternadas entre Node host y Electron, la suite de tests se ejecuta bajo el mismo runtime de Electron mediante:
     `cross-env ELECTRON_RUN_AS_NODE=1 electron ./node_modules/vitest/vitest.mjs run`
   * Esto permite que tanto la aplicación de escritorio como los tests unitarios e integrados compartan idéntico ABI (140), garantizando fidelidad total con el entorno de producción.
3. **Configuración de Publicación en GitHub (`publish`):**
   * El comando `pnpm run publish` ejecuta `pnpm run build && pnpm run rebuild:electron && electron-forge publish`.
   * Carga automáticamente las credenciales desde `GITHUB_TOKEN` en `.env` y publica los artefactos compilados en el repositorio `degetmateo/pos-system-desktop`.
4. **Encapsulamiento de Vistas Frontend y Estándar de ~100 Líneas:**
   * Vistas complejas (`ProductView`, `OrdersView`, `ProductsView`, `CreateOrderView`, `CustomersView`) divididas en clases presentadoras (`Drawer`) y vinculadoras de eventos (`Binder`).
   * Eliminación completa de scripts vendor legacy en `src/public/lib/`, reemplazados por dependencias formales (`chart.js`, `tom-select`, `@zxing/browser`, `navigo`) gestionadas con PNPM y empaquetadas con Vite.

---

## 9. Arquitectura de Interfaz de Usuario Moderna (React 19 + TypeScript + Vite)

### 9.1. Decisiones de Diseño Visual y Paleta de Marca
* **Color Primario (Celeste Institucional):** `#00c8f8` / `#00d2ff` extraído directamente de la identidad visual de `assets/logo.png`.
* **Contrastes y Neutros:** Fondo general `#f8fafc`, tarjetas `#ffffff`, bordes `#e2e8f0` y tipografía principal carbón oscuro `#0f172a` / `#1e293b`.
* **Semántica:** Verde esmeralda `#10b981` para estados completados y descuentos aplicados; rojo `#ef4444` para bajas y advertencias; azul marino `#0369a1` para saldos e información.

### 9.2. Módulos y Flujos de Usuario Implementados
1. **Inicio y Conexión en Red LAN (`HomeView`):**
   * Despliegue de la IP local y puerto del servidor (`http://<IP_LOCAL>:4000`).
   * Generación de código QR dinámico mediante `qrcode.react` para escaneo directo con cámaras de teléfonos inteligentes.
   * Leyenda explícita sobre el requisito de conectividad en la misma red Wi-Fi local.
   * Tarjetas de acceso rápido hacia los módulos clave.
2. **Punto de Venta / Crear Órdenes (`PosView`):**
   * Foco permanente en la entrada de código de barras para pistolas lectoras estándar (lectura y adición automática con 'Enter').
   * Modal de búsqueda manual de productos por nombre con debounce.
   * Conmutador ágil de modalidad: Minorista (evalúa escalas automáticas por cantidad) vs. Mayorista.
   * Asignación de cliente o "Consumidor Final" por defecto.
   * Tabla interactiva de artículos con ajuste de cantidades (+/-), desglose de precios base y precios con descuento, y eliminación rápida.
   * Panel lateral de resumen: subtotal, descuentos totales, selector de medio de pago, registro de adelanto/seña (`advancement`) y saldo pendiente.
   * Modal de comprobante emitido con accesos directos a impresión (`/api/orders/receipt/:id?action=print`) y descarga en PDF (`/api/orders/receipt/:id?action=save`).
3. **Catálogo de Productos (`ProductsView`):**
   * Tabla con búsqueda en vivo por nombre y código de barras.
   * Modal de alta y modificación con generador automático de códigos internos (`RD<YY>...`).
   * Configuración de precios duales (Mayorista y Minorista) y hasta 4 tramos de descuento por volumen (`minor_prices`).
   * Baja lógica con confirmación.
4. **Directorio de Clientes (`CustomersView`):**
   * Búsqueda por nombre o CUIT/CUIL, datos de contacto y tipo de venta preferente.
5. **Historial de Órdenes (`OrdersView`):**
   * Filtrado por cliente y tipo de venta, visualización modal del detalle y reimpresión de comprobantes.
6. **Listas de Precios e Integración Excel (`PriceListsView`):**
   * Descarga de Lista Interna (completa con escalas de descuento) y Lista para Clientes (comercial limpia).
   * Subida de archivo Excel para actualización atómica masiva de precios en base de datos.
7. **Mantenimiento y Respaldo (`BackupsView`):**
   * Listado histórico de copias de seguridad generadas por cron horario y snapshots manuales.
   * **Rebobinado / Restauración:** Función para retroceder la base de datos a un snapshot seleccionado mediante transacción atómica segura y pre-backup de resguardo.
   * Descarga directa del archivo activo `data.db` y desfragmentación `VACUUM`.

### 9.3. Resiliencia de Renderizado y Tolerancia a Fallos (Error Boundary)
* **React ErrorBoundary (`ErrorBoundary.tsx`):** Envuelve el enrutador de vistas dinámico para interceptar cualquier excepción no controlada en tiempo de renderizado de componentes hijos, evitando que React desmonte el árbol completo o deje la pantalla en blanco.
* **Panel de Recuperación:** Brinda un mensaje claro del error junto a botones de acción rápida para reintentar o regresar al inicio de manera segura.

### 9.4. Estrategia de Serialización de Objetos de Dominio (toJSON)
* Para evitar que Value Objects (`Money`, `Barcode`, `OrderType`, `PaymentMethod`) sean transmitidos como objetos anidados (`{ cents }`, `{ value }`, `{ code }`) que provoquen errores fatales de React (`Objects are not valid as a React child`), cada Value Object y Entidad (`Order`, `OrderItem`) implementa un método `toJSON()` estándar que emite tipos primitivos compatibles directamente con los DTOs del frontend.
* Se incorporó desempaquetado defensivo en todos los componentes de tabla y modales para garantizar tolerancia total ante cualquier estructura de datos.

### 9.6. Gestión de Proveedores y Generación Oficial de Comprobantes PDF
* **Buscador y Creación de Proveedores (`ProductProviderSelectModal.tsx`):**
  * Modal interactivo integrado en el formulario de producto que reemplaza el select rígido por un buscador en vivo por nombre.
  * Formulario embebido de alta rápida de nuevos proveedores (`+ Nuevo`) que registra el proveedor en base de datos (`POST /api/providers`) y lo selecciona automáticamente.
* **Descarga Oficial de Comprobante en PDF Real (`PdfMakeAdapter.ts`):**
  * Generación binaria nativa vectorial usando `pdfmake` con tipografía embebida (`vfs_fonts.js`).
  * Emisión con cabeceras HTTP correctas (`Content-Type: application/pdf` y `Content-Disposition: attachment; filename="Orden_<N>.pdf"`), resolviendo la descarga errónea de archivos `.htm`.
* **Detalle Completo de Comprobante (Impresión y PDF):**
  * Cabecera institucional: Librería Rubén Darío, CUIT, N° de Orden, Fecha y Hora, Tipo (Mayorista / Minorista), Medio de pago.
  * Datos completos del cliente (Nombre, CUIT/CUIL, Teléfono, Email, Dirección).
  * Tabla discriminada: N°, Producto, Cantidad, Precio Unitario, Descuento Aplicado, Subtotal.
  * Totales: Total de venta, Adelanto / Seña registrada y Saldo Pendiente.
  * Disclaimer legal al pie:
    * "Documento no válido como factura. Cotización válida por 5 días. Precios sujetos a cambios según disponibilidad de stock al momento de concretar la operación. En caso de solicitar factura A o B, enviar requisitos necesarios según reglamentación vigente ARCA."

### 9.7. Sistema de Migraciones de Base de Datos y Retrocompatibilidad Estricta
* **Motor de Migraciones Versionadas (`SchemaMigrationRunner.ts`):**
  * Control de versiones atómico sobre tabla interna `_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at DATETIME)`.
  * Registro centralizado de migraciones (`MIGRATIONS_REGISTRY` en `migrations.registry.ts`):
    * `v1 (001_initial_schema)`: Estructura base de tablas (`metadata`, `products`, `providers`, `customers`, `minor_prices`, `orders`, `order_item`, `discounts`).
    * `v2 (002_performance_indexes_and_resilience)`: Incorporación no destructiva de columnas retrocompatibles (`customers.default_order_type`, `orders.advancement`, `orders.payment_method`, `products.deleted`) e índices de alta velocidad (`idx_products_barcode`, `idx_products_name`, `idx_customers_name`, `idx_orders_customer_id`, `idx_orders_created_at`, `idx_order_item_order_id`, `idx_minor_prices_product_id`).
  * **Idempotencia y No-Destructividad:** Cada migración inspecciona el catálogo de SQLite (`PRAGMA table_info`) antes de invocar `ALTER TABLE ADD COLUMN`, evitando fallos si una columna ya existía en bases de datos heredadas.
  * Todas las migraciones pendientes se ejecutan secuencialmente dentro de una transacción `db.transaction()` durante la inicialización de la base de datos (`SqliteConnection.initialize()`).

### 9.8. Empaquetado y Distribución para Windows (Production Mode)
* **Scripts de Ciclo de Vida Automatizados (`package.json`):**
  * `pnpm run package`: Compila servidor (`tsc`), bundle de interfaz (`vite build`), recompila el módulo nativo `better-sqlite3` para la ABI de Electron (`NODE_MODULE_VERSION 140`), y genera la versión empaquetada lista para probar en `out/rd-win32-x64/rd.exe`.
  * `pnpm run make`: Ejecuta el flujo completo de empaquetado y genera el instalador oficial de Windows Squirrel (`Setup.exe` y `.nupkg`) en `out/make/squirrel.windows/x64/`.
  * `pnpm run publish` / `pnpm release`: Compila, empaqueta y publica automáticamente los artefactos distribuibles en **GitHub Releases** mediante `@electron-forge/publisher-github` (`degetmateo/pos-system-desktop`).
  * `pnpm run start:prod`: Empaqueta la aplicación y ejecuta directamente el binario compilado de producción (`out\rd-win32-x64\rd.exe`) para pruebas fieles al entorno final.
  * `node-linker=hoisted` configurado en `.npmrc` para compatibilidad total de dependencias nativas en Electron Forge con PNPM.
  * **Sistema de Actualización Gratuito Oficial (`update-electron-app`):**
    * Configurado con el repositorio `degetmateo/pos-system-desktop` en `electron.main.ts`.
    * Consulta automáticamente el servicio público y gratuito de Electron (`update.electronjs.org`) vinculado a los releases públicos de GitHub.
    * `"private": true` configurado en `package.json` para prevenir intentos accidentales de publicación al registro público npmjs.org.
  * **Conectividad LAN y Firewall de Windows (`FirewallService`):**
    * En producción, Squirrel instala cada versión en carpetas versionadas (`app-0.0.x\rd.exe`), lo que invalidaba las reglas de firewall por ejecutable de versiones anteriores.
    * Se incorporó `FirewallService` y el endpoint `POST /api/info/firewall` que permite registrar una regla por puerto (`TCP 4000`, `Profile: Any`) con elevación UAC nativa, garantizando conectividad permanente para teléfonos y tablets a través de todas las actualizaciones de versión.




