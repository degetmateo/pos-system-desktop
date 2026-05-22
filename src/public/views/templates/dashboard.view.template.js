export default () => {
    return `
        <div class="dashboard-button-container">
            <button class="dashboard-button" id="dashboard-button-synchronize" type="button">Sincronizar Productos</button>
            <span>Subir los productos a la página. Si ya existe el producto en la página, se reemplazarán los datos. <b>Esta acción puede tardar un tiempo en completarse.</b> Se puede seguir utilizando el programa para otras cosas mientras tanto.</span>
        </div>

        <div class="dashboard-button-container">
            <button class="dashboard-button" id="dashboard-button-logout" type="button">Cerrar Sesión</button>
            <span>Cerrar la sesión del usuario actual.</span>
        </div>

        <div class="dashboard-button-container">
            <button class="dashboard-button" id="dashboard-button-desynchronize" type="button">Desincronizar datos (NO TOCAR)</button>
        </div>
    `;
};