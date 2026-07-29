export default () => {
    return `
        <div class="products-view-filters-container">
            <input 
                type="text" 
                placeholder="Filtrar por Nombre" 
                id="products-view-name-input"
                class="products-view-input products-view-name-input"
            />

            <input
                type="text"
                placeholder="Código de Barras"
                id="products-view-barcode-input"
                class="products-view-input products-view-barcode-input"
            />

            <select id="products-view-select" class="products-view-select">
                <option value=null>NO ORDENAR</option>
                <option value="abc">ORDENAR ALFABÉTICAMENTE</option>
                <option value="updated_at">FECHA ACTUALIZACIÓN</option>
            </select>
        </div>

        <div class="products-view-table-container">
            <table class="products-view-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Precio Mayorista</th>
                        <th>Precio Minorista</th>
                        <th>Actualización</th>
                    </tr>
                </thead>
                <tbody id="products-view-table-body">
                
                </tbody>
            </table>
        </div>

        <div
            class="products-view-buttons-container"
        >
            <button
                type="button"
                id="products-view-button-previous"
                class="products-view-button"
            >Anterior</button>

            <button
                type="button"
                id="products-view-button-next"
                class="products-view-button"
            >Siguiente</button>
        </div>
    `;
};