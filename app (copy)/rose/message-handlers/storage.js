import DS from '../storage'

const store = DS.getStoreFor('background-script')

export default function (event) {
    const sourceTab = event.source

    const channelID = event.data.channelID
    const operation = event.data.operation
    const args = event.data.arguments

    const resourceName = args[0].name

    switch (operation) {
        case 'create': {
            const attrs = args[1]
            const options = args[2]

            store.create(resourceName, attrs, options)
                .then((item) => sourceTab.dispatchMessage(channelID, item))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'find': {
            const id = args[1]
            const options = args[2]

            store.find(resourceName, id, options)
                .then((item) => sourceTab.dispatchMessage(channelID, item))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'findAll': {
            const params = args[1]
            const options = args[2]

            store.findAll(resourceName, params, options)
                .then((items) => sourceTab.dispatchMessage(channelID, items))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'update': {
            const id = args[1]
            const attrs = args[2]
            const options = args[3]

            store.update(resourceName, id, attrs, options)
                .then((item) => sourceTab.dispatchMessage(channelID, item))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'updateAll': {
            const attrs = args[1]
            const params = args[2]
            const options = args[3]

            store.updateAll(resourceName, attrs, params, options)
                .then((items) => sourceTab.dispatchMessage(channelID, items))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'destroy': {
            const id = args[1]
            const options = args[2]

            store.destroy(resourceName, id, options)
                .then(() => sourceTab.dispatchMessage(channelID))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        case 'destroyAll': {
            const params = args[1]
            const options = args[2]

            store.destroyAll(resourceName, params, options)
                .then(() => kango.dispatchMessage(channelID))
                .catch((err) => sourceTab.dispatchMessage(channelID, { errorMessage: err.message }))

            break
        }
        default:
            throw new Error('Unknown Operation')
    }
}
