export default `
    <div class="product-view-basic-container">
        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Código de Barras</span>
            <input
                class="input app-input"
                id="product-view-basic-info-input-barcode"
                type="text"
                placeholder="Código de Barras"
            />
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Nombre del Producto</span>
            <input
                class="input app-input"
                id="product-view-basic-info-input-name"
                type="text"
                placeholder="Nombre del Producto"
            />
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Precio Mayorista</span>
            <input
                class="input app-input"
                id="product-view-basic-info-input-majorprice"
                type="number"
                placeholder="Precio Mayorista"
                min="0"
            />
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Precio Minorista</span>
            <input
                class="input app-input"
                id="product-view-basic-info-input-minorprice"
                type="number"
                placeholder="Precio Minorista"
                min="0"
            />
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Proveedor</span>
            <select class="app-select" id="product-view-basic-info-input-provider"></select>
        </div>

        <div class="product-view-basic-info-container">
            <button
                class="button app-button"
                id="product-view-basic-info-button-update"
                type="button"
            >Actualizar Producto</button>

            <button
                class="button app-button"
                id="product-view-basic-info-button-delete"
                type="button"
            >Eliminar Producto</button>
        </div>
    </div>

    <div class="product-view-prices-container">
        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Descuento NRO. 1</span>
            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-1"
                    number="1"
                    class="products-create-input input-minorprice-condition"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-1"
                    number="1"
                    class="products-create-input input-minorprice-value"
                />
            </div>
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Descuento NRO. 2</span>
            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-2"
                    number="2"
                    class="products-create-input input-minorprice-condition"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-2"
                    number="2"
                    class="products-create-input input-minorprice-value"
                />
            </div>
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Descuento NRO. 3</span>
            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-3"
                    number="3"
                    class="products-create-input input-minorprice-condition"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-3"
                    number="3"
                    class="products-create-input input-minorprice-value"
                />
            </div>
        </div>

        <div class="product-view-basic-info-container">
            <span class="product-view-basic-info-title">Descuento NRO. 4</span>
            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-4"
                    number="4"
                    class="products-create-input input-minorprice-condition"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-4"
                    number="4"
                    class="products-create-input input-minorprice-value"
                />
            </div>
        </div>
    </div>
`;