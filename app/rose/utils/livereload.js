function onError (error) {
    console.log('reload connection got error' + JSON.stringify(error))
}

function onMessage (event) {
    if (event.data) {
        var data = JSON.parse(event.data)
        if (data && data.command === 'reload') {
            chrome.runtime.reload()
        }
    }
}

function connect () {
    var LIVERELOAD_HOST = 'localhost:'
    var LIVERELOAD_PORT = 35729
    var connection = new WebSocket('ws://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload')

    connection.onerror = onError
    connection.onmessage = onMessage
}

export default { connect }
