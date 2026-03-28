export default `
    <div class="filter-container">
        <label>Desde: <input type="date" id="reports-input-date-start"></label>
        <label>Hasta: <input type="date" id="reports-input-date-end"></label>
        <button id="reports-button-update">Actualizar Gráfico</button>
    </div>
    
    <canvas
        id="reports-view-canvas"
    ></canvas>
`;