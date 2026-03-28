export default `
    <input type="file" accept=".xlsx, .xls" id="internal-list-input" hidden="true" style="display:none;" />
    <div class="options-buttons-container">
        <a style="display: none;" id="options-view-export-db-a" href="/api/options/download-database"></a>

        <button
            id="lists-view-download-internal-list-button"
            class="app-button"
            type="button"
        >EXPORTAR LISTA INTERNA</button>

        <button
            id="lists-view-import-internal-list-button"
            class="app-button"
            type="button"
        >IMPORTAR LISTA INTERNA</button>

        <button
            id="lists-view-download-customers-list-button"
            class="app-button"
            type="button"
        >EXPORTAR LISTA PARA CLIENTES</button>

        <button
            id="options-view-export-db-button"
            class="app-button"
            type="button"
        >EXPORTAR BASE DE DATOS</button>
    </div>
`;