export default `
    <form id="customers-create-form" class="customers-create-form">
        <input
            id="customers-create-name"
            class="input app-input customers-create-input"
            type="text"
            placeholder="Nombre"
            required="true"
        />

        <input
            id="customers-create-cuil"
            class="input app-input customers-create-input"
            type="text"
            placeholder="CUIL/CUIT"
            required="false"
            min="0"
        />

        <input
            id="customers-create-email"
            class="input app-input customers-create-input"
            type="email"
            placeholder="Correo Electrónico"
            required="false"
        />

        <input
            id="customers-create-phone"
            class="input app-input customers-create-input"
            type="text"
            placeholder="Teléfono"
            required="false"
        />

        <input
            id="customers-create-address"
            class="input app-input customers-create-input"
            type="text"
            placeholder="Dirección"
            required="false"
        />

        <select
            id="customers-create-select"
            class="app-select customers-create-select"
        >
            <option value="">SIN ASIGNAR</option>
            <option value="minor">MINORISTA</option>
            <option value="major">MAYORISTA</option>
        </select>

        <button
            type="button"
            id="customers-create-button"
            class="button app-button customers-create-button"
        >CREAR CLIENTE</button>
    </form>
`;