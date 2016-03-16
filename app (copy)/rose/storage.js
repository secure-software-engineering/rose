import JSData from 'js-data'
import DSLocalforageAdapter from 'js-data-localforage'
import DSKangoAdapter from './ds-kango-adapter'

const contentScriptStore = createStore('kango', DSKangoAdapter)
const backgroundStore = createStore('localforage', DSLocalforageAdapter)

function createStore (adapterName, Adapter) {
    const store = new JSData.DS({
        bypassCache: true,
        cacheResponse: false
    })

    store.defineResource('comment')
    store.defineResource('extract')
    store.defineResource('extractor')
    store.defineResource('interaction')
    store.defineResource('observer')
    store.defineResource('system-config')
    store.defineResource('user-config')

    store.registerAdapter(adapterName, new Adapter(), { default: true })

    return store
}

function getStoreFor (environment) {
    if (environment === 'content-script') return contentScriptStore
    if (environment === 'background-script') return backgroundStore
    throw new Error('Unknown Environment')
}

export default {
    getStoreFor
}
