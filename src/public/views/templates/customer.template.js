export default `
    <form id="customer-form" class="customer-view-form">
        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-name" class="customer-view-data-text">Nombre del Cliente</span>
            </div>
            <input
                id="customer-name"
                class="input app-input customers-create-input"
                type="text"
                placeholder="Nombre"
                required="true"
            />
        </div>

        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-cuil" class="customer-view-data-text">CUIL/CUIT</span>
            </div>

            <input
                id="customer-cuil"
                class="input app-input customers-create-input"
                type="text"
                placeholder="CUIL/CUIT"
                required="false"
                min="0"
            />
        </div>

        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-email" class="customer-view-data-text">Correo Electrónico</span>
            </div>
        
            <input
                id="customer-email"
                class="input app-input customers-create-input"
                type="email"
                placeholder="Correo Electrónico"
                required="false"
            />
        </div>

        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-phone" class="customer-view-data-text">Teléfono</span>
            </div>
        
            <input
                id="customer-phone"
                class="input app-input customers-create-input"
                type="text"
                placeholder="Teléfono"
                required="false"
            />
        </div>

        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-address" class="customer-view-data-text">Dirección</span>
            </div>
        
            <input
                id="customer-address"
                class="input app-input customers-create-input"
                type="text"
                placeholder="Dirección"
                required="false"
            />
        </div>

        <div class="customer-view-data-container">
            <div class="customer-view-data">
                <span id="customer-view-data-type" class="customer-view-data-text">Tipo de Orden por Defecto</span>
            </div>
        
            <select
                id="customer-select"
                class="app-select customers-create-select"
            >
                <option value="">SIN ASIGNAR</option>
                <option value="minor">MINORISTA</option>
                <option value="major">MAYORISTA</option>
            </select>
        </div>

        <button
            type="button"
            id="customer-update-button"
            class="button app-button customers-create-button"
        >ACTUALIZAR CLIENTE</button>
    </form>
`;