export default `
    <div class="orders-view-inputs"
        style="
            height: 50px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-bottom: 1px solid #000;
        "
    >
        <input
            type="text"
            placeholder="Cliente"
            id="orders-view-input-filter-name"
        />

        <select id="orders-view-input-filter-type">
            <option value="">SIN ASIGNAR</option>
            <option value="major">MAYORISTA</option>
            <option value="minor">MINORISTA</option>
        </select>
    </div>

    <div class="orders-view-table-container">
        <table class="orders-view-table">
            <thead>
                <tr class="orders-view-table-head-row">
                    <th>N°</th>
                    <th>CLIENTE</th>
                    <th>TIPO</th>
                    <th>MONTO</th>
                    <th>SEÑA</th>
                    <th>PAGO</th>
                    <th>FECHA</th>
                    <th>FACTURA</th>
                </tr>
            </thead>
            <tbody id="orders-view-table-body"></tbody>
        </table>
    </div>

    <div class="orders-view-buttons-container">
        <button
            type="button"
            id="orders-view-button-previous"
            class="orders-view-button"
        >Anterior</button>
        <button
            type="button"
            id="orders-view-button-next"
            class="orders-view-button"
        >Siguiente</button>
    </div>
`;