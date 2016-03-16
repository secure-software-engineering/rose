import uuid from 'uuid'

class DSKangoAdapter {
    create (...args) { return sendMessage('create', args) }
    find (...args) { return sendMessage('find', args) }
    findAll (...args) { return sendMessage('findAll', args) }
    update (...args) { return sendMessage('update', args) }
    updateAll (...args) { return sendMessage('updateAll', args) }
    destroy (...args) { return sendMessage('destroy', args) }
    destroyAll (...args) { return sendMessage('destroyAll', args) }
}

function sendMessage (operation, args) {
    return new Promise((resolve, reject) => {
        const channelID = uuid.v4()

        kango.addMessageListener(channelID, (event) => {
            kango.removeMessageListener(channelID)
            if (event.data.errorMessage) reject(event.data.errorMessage)
            else resolve(event.data)
        })

        kango.dispatchMessage('channel:storage', {
            channelID: channelID,
            operation: operation,
            arguments: args
        })
    })
}

export default DSKangoAdapter
