import Navigation from "../../components/navigation/navigation.js";
import GenericView from "../GenericView.js";

export default class ScannerView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('scanner-view');

        this.view.append(new Navigation());

        this.scannerContainer = document.createElement('div');
        this.scannerContainer.classList.add('scanner-container');
        this.view.append(this.scannerContainer);

        this.scanner = document.createElement('div');
        this.scanner.classList.add('scanner-scanner');
        this.scannerContainer.append(this.scanner);

        this.video = document.createElement('video');
        this.video.classList.add('scanner-video');
        this.scanner.append(this.video);

        this.select = document.createElement('select');
        this.select.classList.add('scanner-select');
        this.scanner.append(this.select);

        this.codeSpan = document.createElement('span');
        this.codeSpan.classList.add('scanner-code-span');
        this.codeSpan.textContent = "Esperando código...";
        this.scanner.append(this.codeSpan);

        this.formattedCodeSpan = document.createElement('span');
        this.formattedCodeSpan.classList.add('scanner-formatted-code-span');
        this.scanner.append(this.formattedCodeSpan);

        this.codeReader = new ZXingBrowser.BrowserMultiFormatReader();
        this.cooldown = true;
        this.code = null;

        this.select.addEventListener('change', () => {
            this.start_scanner();
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);

        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');

        this.select.innerHTML = '';

        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.text = camera.label || `Camera ${this.select.length + 1}`;
            this.select.append(option);
        });

        this.start_scanner();
    };

    start_scanner () {
        this.cooldown = true;

        setTimeout(() => {
            this.cooldown = false;
        }, 3000);

        this.codeReader.decodeFromVideoDevice(
            this.select.value,
            this.video,
            (result, error) => {
                if (this.cooldown) return;
                
                if (result) {
                    // console.log(result);
                    this.print_code(result.text);
                    // this.codeReader.reset()
                    // this.start_scanner();
                }
            }
        ).catch(console.error);
    };

    print_code (code) {
        console.log(code);
        this.code = code;
        this.codeSpan.textContent = 'Último código: ' + code;
        this.formattedCodeSpan.textContent = this.format_code(code);
    };

    format_code (code) {
        code = code.trim();

        switch (code.length) {
            case 8:
                return code.slice(0, 4) + ' ' + code.slice(4, 8);
            case 12:
                return code.slice(0, 4) + ' ' + code.slice(4, 8) + ' ' + code.slice(8, 12);
            case 13:
                return code.slice(0, 1) + ' ' + code.slice(1, 7) + ' ' + code.slice(7, 13);
            default:
                return code;
        };
    };
};