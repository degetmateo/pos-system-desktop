const os = require('os');

module.exports = function getLanIP () {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        (
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          (
            iface.address.startsWith('172.') &&
            (() => {
              const second = Number(iface.address.split('.')[1])
              return second >= 16 && second <= 31
            })()
          )
        )
      ) {
        return iface.address
      }
    }
  }

  return null
}