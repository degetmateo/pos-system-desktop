# RD POS System - Sistema de Punto de Venta y Gestión Comercial

Sistema de escritorio y red local desarrollado para la administración de catálogo, facturación ágil en mostrador y gestión integral de comercios minoristas y mayoristas (librería y papelería comercial).

---

## 🚀 ¿Cómo Funciona el Sistema?

El sistema combina la potencia y portabilidad de una aplicación de escritorio con la flexibilidad de una arquitectura cliente-servidor distribuida en red de área local (LAN).

```mermaid
flowchart TD
    subgraph Host["Computadora Principal (Host Anfitrión)"]
        subgraph ElectronApp["Aplicación Electron Desktop"]
            BrowserWin["Ventana Principal (BrowserWindow)\nCarga: http://localhost:4000"]
            Preload["Preload ContextBridge\n(IPC: ping, local-ip, sql)"]
        end

        subgraph ExpressServer["Servidor HTTP Local (Express :4000)"]
            Router["API REST Endpoints\n(/api/products, /api/orders, /api/options...)"]
            StaticServ["Servidor de Archivos Estáticos\n(Frontend SPA /public)"]
            CronJobs["Cron de Backups Horarios\n(Retención 72 copias)"]
        end

        subgraph Storage["Persistencia Local"]
            SQLite[("Base de Datos SQLite\nbetter-sqlite3 (data.db)")]
            Backups[("Directorio de Backups\nuserData/backups/")]
        end

        BrowserWin -->|HTTP| ExpressServer
        ExpressServer -->|Consultas y Transacciones| SQLite
        CronJobs -->|Backup Snapshot horario| Backups
    end

    subgraph LAN["Dispositivos en la Misma Red Local (LAN Wi-Fi / Ethernet)"]
        Device1["📱 Teléfono Celular (Vendedor / Escáner)\nhttp://192.168.x.x:4000"]
        Device2["💻 Segunda Computadora (Caja / Depósito)\nhttp://192.168.x.x:4000"]
        Device3["📟 Tablet Mostrador\nhttp://192.168.x.x:4000"]
    end

    Device1 -->|HTTP Wi-Fi Local| ExpressServer
    Device2 -->|HTTP Red Local| ExpressServer
    Device3 -->|HTTP Wi-Fi Local| ExpressServer

    subgraph Cloud["Servicios Externos"]
        RenderAPI["☁️ Servidor en la Nube (Opcional)\nlibreriard.onrender.com"]
    end

    ExpressServer -.->|Sincronización por Lotes| RenderAPI
```

### Principio de Operación
1. **Inicio del Núcleo:** Al ejecutar la aplicación, Electron inicializa la base de datos local SQLite (`SchemaMigrationRunner`), ensambla los servicios mediante `AppContainer` y arranca el servidor Express embebido en el puerto `4000`.
2. **Interfaz de Escritorio:** Electron abre su ventana principal apuntando a `http://localhost:4000`, ofreciendo al usuario una experiencia de aplicación nativa.
3. **Acceso Multi-Dispositivo Simultáneo:** Cualquier dispositivo conectado a la misma red local (Wi-Fi o cable de red) puede abrir el navegador web e ingresar a `http://<IP_LOCAL>:4000` para operar el sistema en tiempo real. La IP local del servidor se calcula y muestra automáticamente en la pantalla de inicio del sistema.
4. **Almacenamiento Local Offline:** No depende de conectividad a internet para facturar o consultar precios. Todos los datos residen en `data.db` en el equipo local.
5. **Backups Automatizados:** Cada hora se toma una instantánea completa de la base de datos con rotación automática de hasta 72 copias (3 días continuos de historial).

---

## 📦 Módulos Principales del Sistema

### 1. Punto de Venta (POS) y Órdenes de Venta
* Creación de órdenes en mostrador con selección ágil de cliente y tipo de venta (Mayorista o Minorista).
* **Modalidad V2 en Planilla Rápida (Hoja de Cálculo / Excel):** Carga continua de artículos en tabla dinámica con autocompletado flotante de productos sobre el nombre, navegación con teclado (flechas, `Tab` y `Enter` para saltar de fila o generar nuevas filas automáticamente) y alta/actualización directa en base de datos.
* **Experiencia Móvil Nativa (Responsive POS):** Interfaz adaptativa optimizada para teléfonos celulares y tablets en red LAN con tarjetas táctiles de carrito, botones de cantidad ergonómicos y prevención de zoom automático.
* Escaneo de códigos de barra mediante pistola lectora o cámara web con decodificación en vivo.
* **Atajo para Rehacer Órdenes:** Botón directo tanto en el historial de órdenes como en el modal de detalle de comprobante que carga todos los datos de una orden existente en una nueva orden para rehacerla y modificarla libremente en la vista V2 antes de confirmar.
* **Cálculo de Descuentos por Volumen:** En ventas minoristas, evalúa dinámicamente las cantidades de cada producto y aplica los precios de escala definidos.
* Registro de métodos de pago (Efectivo, Transferencia, Tarjeta, Cuenta Corriente) y pagos a cuenta / adelantos (`advancement`).
* Emisión e impresión directa de comprobantes de venta (no válidos como factura) con detalle de importes, descuentos y datos bancarios para transferencia.
* **Captura de Comprobante / Presupuesto en Imagen:** Generación automática de imagen idéntica al formato de cotización en Excel con logo, cabecera de contacto, número correlativo de comprobante (`ORDEN N° <N>`), datos de pago (`ALIAS : ogro.caso.ruina`) y total a cobrar copiada al portapapeles para pegar directamente en aplicaciones de mensajería (`Ctrl + V`).
* **Copia Rápida de PDF al Portapapeles:** Inyección del archivo PDF en el portapapeles de Windows para adjuntarlo sin descargas ni búsquedas en carpetas.
* Descarga de recibos en formato PDF e impresión térmica/A4 directa.

### 2. Catálogo de Productos
* Gestión completa de artículos con nombre, descripción, código de barras y proveedor asignado.
* Esquema financiero en centavos para eliminar discrepancias de redondeo monetario.
* Precios diferenciados (Mayorista y Minorista) y configuración de hasta 4 tramos de descuento por volumen.
* **Historial de Precios y Auditoría:** Registro cronológico exhaustivo de cada cambio de precio (`price_history`) con valor anterior, nuevo, diferencia monetaria y porcentaje de variación.
* **Ordenamiento por Actualización de Precios:** Capacidad de ordenar productos por su última fecha de modificación de precios (`price_updated_at`).
* Generador de códigos de barras internos normalizados (`RD<YY><000000000>`).
* **Búsqueda Multi-Término con Ranking por Relevancia:** Búsqueda independiente por cada palabra del término ingresado insensible a mayúsculas/minúsculas, posicionando más arriba los resultados con mayor cantidad de coincidencias.
* Baja lógica (*soft delete*) para proteger la integridad histórica de ventas.

### 3. Clientes y Proveedores
* Agenda comercial de clientes con CUIL/CUIT, correo electrónico, teléfono, dirección, **nombre de contacto / alias**, **nivel de importancia comercial (`important`, `normal`, `low`, `ignore`)** y tipo de lista preferente (`minor`, `major` o `Sin asignar`).
* **Buscador Integral Multi-Campo:** Búsqueda multi-término por relevancia sobre nombre formal, alias, número de teléfono, correo electrónico, CUIL/CUIT, dirección y notas, con filtros combinables por tipo de lista, nivel de importancia y datos registrados.
* Directorio de proveedores comerciales con asignación de códigos y protección referencial en bajas.

### 4. Gestión de Listas de Precios e Integración con Excel
* **Exportación de Lista Interna:** Generación de archivo Excel estructurado con precios y las 4 escalas de descuento.
* **Exportación de Lista para Clientes:** Catálogo en formato `.xlsx` limpio y ordenado para envío comercial a clientes.
* **Importación Masiva:** Actualización masiva de precios y descuentos mediante subida de planilla Excel procesada en una única transacción atómica.

### 5. Respaldo, Mantenimiento de Base de Datos y Exportación Masiva
* **Exportación Masiva de Productos (BULK_PRODUCT_IMPORT_SPEC.md):**
  * **Exportación en JSON (`productos-bulk-import.json`):** Descarga directa con formato estricto según la especificación técnica de carga masiva (`name`, `id`, `description`, `barcode`, `retailPrice` y `wholesalePrice` en Pesos ARS, `retailPriceTiers` con descuentos de escala minorista, `supplier` resuelto, `categories`, `tags`, `isActive`).
  * **Exportación en Excel (`productos-bulk-import.xlsx`):** Descarga estructurada con las 10 columnas oficiales de la especificación: `ID (Opcional)`, `Nombre *`, `Código de Barras`, `Precio Minorista`, `Precio Mayorista`, `Proveedor`, `Categorías (coma)`, `Etiquetas (coma)`, `Activo (SI/NO)` y `Descripción`.
* Tarea cron horaria de copias de seguridad de SQLite con capacidad de restauración atómica.
* Herramienta de desfragmentación y optimización de base de datos (`VACUUM`) desde el panel de opciones.
* Descarga directa del archivo de base de datos `.db` para resguardo manual externo.

### 6. Estadísticas y Analítica Comercial (`StatisticsView`)
* **Panel Integral de Estadísticas (`Estadísticas`):** Vista dedicada con indicadores clave (KPIs), tablas comparativas y gráficos interactivos renderizados con `Chart.js` (`7 días`, `30 días`, `90 días`, `1 año`, `Histórico` o rango de fechas personalizado):
  * **Evolución de Ventas y Órdenes:** Facturación diaria discriminada entre Minorista y Mayorista, ticket promedio, descuentos otorgados, señas/saldos pendientes y distribución por medio de pago.
  * **Compras de Clientes y Productos Estrella:** Ranking de clientes con mayor facturación acumulada (con su nivel de importancia) y ranking de artículos más vendidos por unidades e ingresos.
  * **Precios del Catálogo e Historial de Variaciones:** Promedios, mínimos y máximos de precios minoristas/mayoristas del catálogo y auditoría de variaciones registradas en `price_history` durante el período seleccionado.

---

## 🛠️ Tecnologías y Estado de Arquitectura

| Aspecto | Estado | Tecnología Implementada |
| :--- | :--- | :--- |
| **Gestor de Paquetes** | Migrado | **PNPM** (`pnpm-lock.yaml`) |
| **Lenguaje** | Migrado 100% | **TypeScript** (Strict Mode de punta a punta) |
| **Arquitectura Frontend** | Migrado | **React 19** + **TypeScript** + **Vite** + **Chart.js** + **QR LAN** |
| **Arquitectura Backend** | Migrado | **Capas y Clases** (PEAA + GoF + POSAD + SOLID) |
| **Exportación Masiva** | Implementado | **BulkProductExportService** (JSON y Excel según `BULK_PRODUCT_IMPORT_SPEC.md`) |
| **Límite de Clases/Archivos**| Cumplido | **~100 líneas máximo** por clase/archivo (SRP estricto) |
| **Testing** | 100% Pasando | **Vitest** (**93 tests en 24 suites**: Dominio, Casos de Uso, Repositorios, Migraciones, Concurrencia Cooperativa, POS V1/V2, Capturas, Historial de Precios, Búsqueda por Relevancia, Rehacer Órdenes, Exportación Masiva JSON/Excel, Estadísticas, Express, Firewall) |
| **Retrocompatibilidad** | Garantizada | **SchemaMigrationRunner** con migraciones atómicas e idempotentes (`v1` a `v10`) |

Para detalles exhaustivos sobre los patrones de diseño (PEAA, GoF y POSAD), requerimientos funcionales y decisiones técnicas, consultar el archivo [`REQUERIMIENTOS.md`](./REQUERIMIENTOS.md).

---

## 💻 Requisitos Previos e Instalación

### Requisitos
* **Node.js:** Versión 20.0 o superior (recomendado v22+ o v24+).
* **PNPM:** Gestor de paquetes recomendado (`npm install -g pnpm`).

### Instalación con PNPM

```bash
# 1. Clonar el repositorio
git clone https://github.com/degetmateo/pos-system-desktop.git
cd pos-system-desktop

# 2. Instalar dependencias con PNPM (genera node_modules con node-linker=hoisted según .npmrc)
pnpm install

# 3. Iniciar la aplicación en modo desarrollo
pnpm start
```

### Scripts Disponibles en `package.json`
* `pnpm start`: Compila el servidor TypeScript y el frontend Vite, asegura el módulo nativo `better-sqlite3` en ABI 140 de Electron (`electron-rebuild`) e inicia la aplicación mediante Electron Forge.
* `pnpm test`: Ejecuta la suite de pruebas unitarias e integradas con Vitest directamente sobre el entorno de Electron Node (`cross-env ELECTRON_RUN_AS_NODE=1`), compartiendo el mismo ABI 140 sin conflictos de compilación.
* `pnpm run build`: Compila TypeScript para el backend (`tsconfig.server.json`) y empaqueta el frontend con Vite.
* `pnpm run package`: Empaqueta la aplicación completa en binarios ejecutables locales para Windows en `out/rd-win32-x64/rd.exe`.
* `pnpm run package:win`: Empaqueta explícitamente para la plataforma Windows (`win32 x64`) desde cualquier sistema operativo (Linux, macOS o Windows).
* `pnpm run start:prod`: Empaqueta la aplicación y lanza de inmediato el binario empaquetado `out\rd-win32-x64\rd.exe` para probar la aplicación exactamente como se comportará en producción.
* `pnpm run make`: Genera los instaladores oficiales y distribuibles de producción (instalador Squirrel Windows: `Setup.exe`, `.nupkg` y `RELEASES` en `out/make/squirrel.windows/x64/`).
* `pnpm run make:win`: Genera los distribuibles e instaladores especificando la plataforma Windows (`win32 x64`) en `out/make/`.
* `pnpm run release` (o `pnpm run publish`): Compila, recompila módulos nativos y publica la release en GitHub Releases con los instaladores (`@electron-forge/publisher-github`).
* `pnpm run release:win` (o `bash scripts/release-win.sh`): Script especializado para realizar el release de Windows desde Linux/macOS. Valida `GITHUB_TOKEN`, compila la app y publica en GitHub Releases o genera los artefactos locales (`--make-only` / `--dry-run`).

### 🛡️ Acceso Móvil (LAN) y Firewall de Windows en Producción
En modo desarrollo (`pnpm start`), el binario que atiende las conexiones es `electron.exe`. Al compilar e instalar en producción (`Squirrel.Windows`), cada versión se aloja en un directorio dinámico (`AppData\Local\rd\app-<version>\rd.exe`), lo que provoca que Windows Defender Firewall bloquee por defecto las conexiones entrantes desde celulares si no existe una regla por puerto.

Para habilitar permanentemente el acceso desde cualquier dispositivo celular o tablet sin importar las actualizaciones de versión:
* **Desde la aplicación**: En la pantalla de inicio, hacer clic en el botón **"Habilitar acceso en Firewall"** (solicitará confirmación de administrador de Windows).
* **O mediante PowerShell (como Administrador)**:
  ```powershell
  New-NetFirewallRule -DisplayName "RD POS System (Puerto 4000)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any
  ```
  *(O con netsh: `netsh advfirewall firewall add rule name="RD POS System (Puerto 4000)" dir=in action=allow protocol=TCP localport=4000 profile=any`)*

---

## 📐 Estructura del Directorio del Proyecto

```
rd/
├── assets/                     # Recursos visuales (íconos .ico, logos .png, binarios nativos prebuilt)
├── dist/                       # Artefactos compilados de TypeScript y Vite (dist/public)
├── src/
│   ├── domain/                 # Capa de Dominio (Entidades, Value Objects, Estrategias de Precios)
│   │   ├── errors/             # Errores de dominio (NotFound, Conflict, InvalidArgument)
│   │   ├── models/             # Product, Order, Customer, Provider...
│   │   ├── strategies/         # PricingStrategy (Major, Minor por escala)
│   │   └── value-objects/      # Money, Barcode, PaymentMethod, OrderType, PhoneNormalizer, CustomerImportance
│   ├── application/            # Capa de Aplicación (Casos de Uso, Servicios, Puertos, DTOs)
│   │   ├── dtos/               # DTOs de entrada/salida tipados (product, order, customer, statistics...)
│   │   ├── ports/              # Interfaces de repositorios y generadores de comprobantes
│   │   └── services/           # ProductService, OrderService, BulkProductExportService, StatisticsService...
│   ├── infrastructure/         # Capa de Infraestructura (Persistencia, Adaptadores, Mantenimiento)
│   │   ├── adapters/           # ExceljsAdapter, PdfMakeAdapter
│   │   ├── database/           # SqliteConnection (WAL mode), SchemaMigrationRunner, migrations/ (001..010)
│   │   ├── maintenance/        # BackupFacade (snapshots rotativos horarios)
│   │   └── repositories/       # Repositorios SQLite + stats/ + mappers/ + search/
│   ├── presentation/           # Capa de Presentación (Servidor Express y Controladores REST)
│   │   ├── controllers/        # ProductController, OrderController, OptionsController, StatisticsController...
│   │   └── server/             # ExpressApp, HttpResponseHelper
│   ├── desktop/                # Proceso Principal de Electron
│   │   ├── electron.main.ts    # Ciclo de vida de Electron y arranque del servidor
│   │   ├── app.container.ts    # Contenedor de inyección de dependencias del backend
│   │   ├── window.factory.ts   # Factory para creación de BrowserWindow y auto-reintento
│   │   └── preload.ts          # ContextBridge seguro
│   └── public/                 # Frontend Web SPA (React 19 + TypeScript + Vite)
│       ├── components/         # Sidebar, Header, ImportanceBadge, ToastContainer, ErrorBoundary
│       ├── services/           # ApiClient, OrderCaptureService, ToastService...
│       ├── types/              # DTOs de API y tipos de dominio UI (api.types, statistics.types)
│       ├── views/              # HomeView, PosView, PosV2View, StatisticsView, ProductsView, BackupsView...
│       │   ├── home/           # HomeShortcutGrid
│       │   ├── statistics/     # ChartCanvas, StatsKpiGrid, StatsSalesCharts, StatsCommercialTables, StatsPriceAnalytics
│       │   ├── pos/            # PosCartTable, PosV2Grid, PosSummaryPanel, PosReceiptModal...
│       │   ├── products/       # ProductsTable, ProductModal, ProductDiscountsSubForm...
│       │   ├── customers/      # CustomersFilterBar, CustomersTable, CustomerModal
│       │   └── orders/         # OrdersTable, OrderDetailModal
│       ├── styles/             # app.css
│       ├── App.tsx             # Componente raíz con enrutamiento de vistas y layout responsivo
│       ├── main.tsx            # Punto de montaje React 19
│       └── index.html          # HTML principal con viewport mobile y logo favicon
├── tests/                      # Suite de pruebas unitarias e integradas con Vitest (93 tests en 24 suites)
├── forge.config.js             # Configuración de empaquetado y publicación de Electron Forge
├── package.json                # Configuración de dependencias, scripts de build y tests
├── tsconfig.json               # Configuración de TypeScript
├── vite.config.mts             # Configuración de bundling del frontend con Vite
├── vitest.config.mts           # Configuración de runner de pruebas con Vitest
├── README.md                   # Descripción general y guía de uso
└── REQUERIMIENTOS.md           # Requerimientos, patrones PEAA/GoF/POSAD y decisiones de diseño
```

---

## 🏛️ Lineamientos de Arquitectura y Contribución

1. **Principio de Responsabilidad Única (SRP):** Cada clase y archivo debe resolver una sola responsabilidad.
2. **Límite de ~100 líneas por archivo:** Si una clase o archivo sobrepasa las 100 líneas aproximadas, debe refactorizarse extrayendo responsabilidades auxiliares en colaboradores, estrategias, factorías o adaptadores.
3. **Encapsulamiento en Clases:** Se prioriza la programación orientada a objetos con clases cohesivas y tipadas.
4. **Patrones PEAA, GoF y POSAD:** Toda persistencia pasa por `Repositories` y `Data Mappers`; la lógica de negocio reside en el `Domain Model`, `Value Objects` y `Service Layer`; y las integraciones externas (como `exceljs`, `pdfmake`) están aisladas tras `Adapters`, `Factories` y `Wrapper Facades`.
5. **Aritmética Monetaria Segura:** Los precios siempre se manejan en centavos enteros para evitar errores de precisión en coma flotante.
6. **Tests Obligatorios:** Toda nueva funcionalidad o refactorización debe estar respaldada por sus pruebas unitarias e integradas correspondientes.
