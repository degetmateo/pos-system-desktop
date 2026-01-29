class AudioManager {
    constructor () {
        this.audioError = new Audio('/public/sounds/error.mp3');
        this.audioError.volume = 1;
        this.audioSuccess = new Audio('/public/sounds/success.mp3');
        this.audioSuccess.volume = 1;
    };

    play (type) {
        switch (type) {
            case 'success':
                this.audioSuccess.currentTime = 0;
                this.audioSuccess.play();
            break;
            case 'error':
                this.audioError.currentTime = 0;
                this.audioError.play();
            break;
        };
    };
};

export default new AudioManager();