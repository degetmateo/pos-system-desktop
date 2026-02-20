export default `
    <div class="products-create-column">
        <div class="products-create-form">
            <input 
                type="text"
                placeholder="Código de Barras"
                id="products-create-input-barcode"
                class="products-create-input"
            />

            <input
                type="text"
                placeholder="Nombre"
                id="products-create-input-name"
                class="products-create-input"
            />

            <input
                type="number"
                placeholder="Precio Mayorista"
                min="0"
                id="products-create-input-majorprice"
                class="products-create-input"
            />

            <input
                type="number"
                placeholder="Precio Minorista"
                min="0"
                id="products-create-input-minorprice"
                class="products-create-input"
            />

            <input
                type="number"
                placeholder="Stock"
                min="0"
                id="products-create-input-stock"
                class="products-create-input"
            />

            <button
                type="button"
                id="products-create-button-submit"
                class="products-create-button"
            >Crear Producto</button>
        </div>

        <div class="products-create-form">
            <button
                type="button"
                id="products-create-button-barcode"
                class="products-create-button"
            >Generar Código de Barras Interno</button>
        </div>

        <div class="products-create-form">
            <input
                type="file"
                accept="image/*"
                id="products-create-input-image"
                hidden=true
            />

            <button
                type="button"
                id="products-create-button-image"
                class="products-create-button"
            >Seleccionar Imagen</button>
        </div>

        <div class="products-create-form">
            <button
                type="button"
                id="products-create-button-reset"
                class="products-create-button"
            >Reiniciar</button>
        </div>
    </div>

    <div class="products-create-column">
        <div class="products-create-form">
            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-1"
                    class="products-create-input"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-1"
                    class="products-create-input"
                />
            </div>

            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-2"
                    class="products-create-input"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-2"
                    class="products-create-input"
                />
            </div>

            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-3"
                    class="products-create-input"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-3"
                    class="products-create-input"
                />
            </div>

            <div class="products-create-minorprice">
                <input
                    type="number"
                    placeholder="Condición"
                    min="0"
                    id="products-create-input-condition-4"
                    class="products-create-input"
                />
                <input
                    type="number"
                    placeholder="Nuevo Precio Minorista"
                    min="0"
                    id="products-create-input-minorprice-4"
                    class="products-create-input"
                />
            </div>
        </div>
    </div>

    <div class="products-create-column">
        <div class="products-create-form">
            <select 
                id="products-create-select-provider"
                class="products-create-select"
            >
                <option value="">SIN ASIGNAR</option>
            </select>
            <div class="products-create-provider">
                <input
                    type="text"
                    placeholder="Proveedor"
                    id="products-create-input-provider"
                    class="products-create-input"
                />
                <button
                    type="button"
                    id="products-create-button-provider"
                    class="products-create-button"
                >Crear</button>
            </div>
        </div>
    </div>
`;