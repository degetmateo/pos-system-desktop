class ProductCard extends HTMLElement {
    constructor (data) {
        super();
        this.data = data;

        this.classList.add('product-card');

        this.img = document.createElement('img');
        this.img.classList.add('product-card-image');
        this.img.src = '/api/products/image/'+this.data.id+'?t='+new Date().getTime();
        this.append(this.img);

        this.barcodeContainer = document.createElement('div');
        this.barcodeContainer.classList.add('product-card-barcode-container');
        this.append(this.barcodeContainer);

        this.barcodeTitle = document.createElement('span');
        this.barcodeTitle.textContent = 'Código de Barras:';
        this.barcodeContainer.append(this.barcodeTitle);

        this.barcode = document.createElement('span');
        this.barcode.classList.add('product-card-barcode');
        this.barcode.textContent = this.data.barcode;
        this.barcodeContainer.append(this.barcode);

        this.nameContainer = document.createElement('div');
        this.nameContainer.classList.add('product-card-container', 'product-card-name-container');
        this.append(this.nameContainer);

        this.nameTitle = document.createElement('span');
        this.nameTitle.textContent = 'Nombre';
        this.nameContainer.append(this.nameTitle);

        this.inputName = document.createElement('input');
        this.inputName.classList.add('product-card-input-name');
        this.inputName.type = 'text';
        this.inputName.value = this.data.name;
        this.nameContainer.append(this.inputName);

        this.stockContainer = document.createElement('div');
        this.stockContainer.classList.add('product-card-container', 'product-card-stock-container');
        this.append(this.stockContainer);

        this.stockTitle = document.createElement('span');
        this.stockTitle.textContent = 'Stock';
        this.stockContainer.append(this.stockTitle);

        this.inputStock = document.createElement('input');
        this.inputStock.classList.add('product-card-input-stock');
        this.inputStock.type = 'number';
        this.inputStock.min = 0;
        this.inputStock.value = this.data.stock;
        this.stockContainer.append(this.inputStock);

        this.priceMajorContainer = document.createElement('div');
        this.priceMajorContainer.classList.add('product-card-container', 'product-card-price-major-container');
        this.append(this.priceMajorContainer);

        this.priceMajorTitle = document.createElement('span');
        this.priceMajorTitle.textContent = 'Precio Mayorista';
        this.priceMajorContainer.append(this.priceMajorTitle);

        this.inputPriceMajor = document.createElement('input');
        this.inputPriceMajor.type = 'number';
        this.inputPriceMajor.min = 0;
        this.inputPriceMajor.value = this.data.price_major / 100;
        this.priceMajorContainer.append(this.inputPriceMajor);

        this.minorPriceContainer = document.createElement('div');
        this.minorPriceContainer.classList.add('product-card-container', 'product-card-price-minor-container');
        this.append(this.minorPriceContainer);

        this.minorPriceTitle = document.createElement('span');
        this.minorPriceTitle.textContent = 'Precio Minorista';
        this.minorPriceContainer.append(this.minorPriceTitle);

        this.inputMinorPrice = document.createElement('input');
        this.inputMinorPrice.type = 'number';
        this.inputMinorPrice.min = 0;
        this.inputMinorPrice.value = this.data.price_minor / 100;
        this.minorPriceContainer.append(this.inputMinorPrice);

        this.inputImageContainer = document.createElement('div');
        this.inputImageContainer.classList.add('product-card-container');
        this.append(this.inputImageContainer);

        this.inputImageTitle = document.createElement('span');
        this.inputImageTitle.textContent = 'Imagen del Producto';
        this.inputImageContainer.append(this.inputImageTitle);

        this.inputImage = document.createElement('input');
        this.inputImage.type = 'file';
        this.inputImage.accept = 'image/*';
        this.inputImageContainer.append(this.inputImage);

        this.button = document.createElement('button');
        this.button.type = 'submit';
        this.button.textContent = 'Guardar Cambios';
        this.button.classList.add('product-card-button');
        this.append(this.button);
    
        this.button.addEventListener('click', () => {
            this.submit();
        });

        this.message = document.createElement('span');
        this.message.textContent = '';
        this.message.classList.add('product-card-message');
        this.append(this.message);
    };

    async submit () {
        try {
            const name = this.inputName.value;
            const stock = this.inputStock.value;
            const price_major = this.inputPriceMajor.value;
            const price_minor = this.inputMinorPrice.value;

            const form = new FormData();

            form.append('image', this.inputImage.files[0]);
            form.append('data', JSON.stringify({
                name,
                stock,
                price_major,
                price_minor
            }));

            const request = await fetch('/api/products/'+this.data.id, {
                method: "PUT",
                body: form
            });

            const response = await request.json();

            if (!request.ok) throw new Error(response.error.message);

            this.img.src = '/api/products/image/'+this.data.id+'?t='+new Date().getTime();

            this.message.classList.remove('product-card-message-error');
            this.message.classList.add('product-card-message-success');
            this.message.textContent = 'Cambios guardados correctamente.';
        } catch (error) {
            this.message.classList.remove('product-card-message-success');
            this.message.classList.add('product-card-message-error');
            this.message.textContent = error.message;
            console.error(error);
        };
    };
};

customElements.define('app-product-card', ProductCard);
export default ProductCard;