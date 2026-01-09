const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${app.chrome}), Node.js (v${app.node}), and Electron (v${app.electron})`

const func = async () => {
    const response = await app.ping();
    console.log(response);
}

func();