import fetch from 'isomorphic-fetch'

import ConfigModel from './models/system-config'
import ObserverCollection from './collections/observers'
import ExtractorCollection from './collections/extractors'
import NetworkCollection from './collections/networks'
import verify from './verify.js'

/**
 * TODO:
 * - fix execution order, so data is fetch properly
 * - Rewrite updateExtractor and UpdateObserver so they don't fetch the storage every f***kin item in the repo.
 */

function updateExtractor (extractor) {
    return new Promise((resolve, reject) => {
        const extractors = new ExtractorCollection()
        extractors.fetch({
            success: (col, response, options) => {
                const model = col.findWhere({
                    name: extractor.name,
                    network: extractor.network
                })
                if (!model) return resolve()
                if (extractor.version > model.get('version')) {
                    model.save(extractor, {
                        success: (model, response) => resolve(response),
                        error: (model, response) => reject(response)
                    })
                } else {
                    resolve()
                }
            }
        })
    })
}

function updateObserver (observer) {
    return new Promise((resolve, reject) => {
        const observers = new ObserverCollection()
        observers.fetch({
            success: (col, response, options) => {
                const model = col.findWhere({
                    name: observer.name,
                    network: observer.network
                })
                if (!model) return resolve()
                if (observer.version > model.get('version')) {
                    model.save(observer, {
                        success: (model, response) => resolve(response),
                        error: (model, response) => reject(response)
                    })
                } else {
                    resolve()
                }
            }
        })
    })
}

function VerificationException (message) {
    this.message = message
    this.name = 'VerificationException'
}

function checkStatus (res) {
    if (res.status >= 200 && res.status < 300) {
        return res.text()
    } else {
        throw new Error(res.statusText)
    }
}

function signedFetch (key, fp) {
    fp = fp.toLowerCase()

    return async function (fileURL) {
        let fileText = await fetch(fileURL).then(checkStatus)
        let sigText = await fetch(`${fileURL}.asc`).then(checkStatus)

        let fingerprint = await verify(fileText, sigText, key)

        if (fingerprint.toLowerCase() !== fp) {
            throw new VerificationException('Fingerprint Missmatch')
        }
        let jsonFile = JSON.parse(fileText)
        return jsonFile
    }
}

function unsignedFetch () {
    return async function (fileURL) {
        let fileData = await fetch(fileURL).then(checkStatus).then((txt) => JSON.parse(txt))
        return fileData
    }
}

async function fetchRepository (config) {
    const baseFileUrl = config.get('repositoryURL')
    const repositoryUrl = baseFileUrl.substring(0, baseFileUrl.lastIndexOf('/'))

    // Generate a fetch function to reuse
    // Either with validation or without
    let fetchJSONFile
    if (config.get('forceSecureUpdate') && config.get('secureUpdateIsEnabled')) {
        let publicKeyText = await fetch(`${repositoryUrl}/public.key`).then(checkStatus)
        let fingerprint = config.get('fingerprint').toLowerCase()
        fetchJSONFile = signedFetch(publicKeyText, fingerprint)
    } else {
        fetchJSONFile = unsignedFetch()
    }

    //  basefile download
    let baseFile = await fetchJSONFile(baseFileUrl)
    let repository = []

    await new NetworkCollection().fetch({success: async (localNetworks) => {
        await localNetworks.each(async (localNetwork) => {
            let network = baseFile.networks.find((nw) => nw.name === localNetwork.get('name'))
            let networkIndex = repository.push({name: network.name, extractors: [], observers: []}) - 1

            console.log('Fetch Network...' + network.name)
            if (network.extractors) {
                repository[networkIndex].extractors = await fetchJSONFile(`${repositoryUrl}/${network.extractors}`)
                console.log('Fetched ' + network.name + ' Extractors!')
            }

            if (network.observers) {
                repository[networkIndex].observers = await fetchJSONFile(`${repositoryUrl}/${network.observers}`)
                console.log('Fetched ' + network.name + ' Observers!')
            }
        })
    }})

    console.log('Return Repository!')
    return repository
}

async function updateChanges (config, networks) {
    const stats = []

    for (let network of networks) {
        let networkStats = {
            name: network.name,
            updatedExtractors: [],
            updatedObservers: []
        }

        for (let extractor of network.extractors) {
            let updatedExtractor = await updateExtractor(extractor)
            if (updatedExtractor) networkStats.updatedExtractors.push(extractor.name)
        }

        for (let observer of network.observers) {
            let updatedObserver = await updateObserver(observer)
            if (updatedObserver) networkStats.updatedObservers.push(observer.name)
        }

        stats.push(networkStats)
    }

    return stats
}

function update () {
    const config = new ConfigModel()

    return new Promise((resolve, reject) => {
        config.fetch({
            success: async (config, response, options) => {
                // fetch repository

                try {
                    var repository = await fetchRepository(config, reject)
                } catch (e) {
                    return reject(e)
                }

                // update contents in storage
                let stats = await updateChanges(config, repository)

                await config.set('lastChecked', Date.now()).save()

                if (stats.some((network) => network.updatedExtractors.length + network.updatedObservers.length > 0)) {
                    await config.set('lastUpdated', Date.now()).save()
                }

                resolve(stats)
            }
        })
    })
}

let load = (networks) => {
    return new Promise((resolve) => {
        new NetworkCollection().fetch({success: (networkCol) => {
            new ObserverCollection().fetch({success: (observerCol) => {
                new ExtractorCollection().fetch({success: (extractorCol) => {
                    for (var i = 0; i < networks.length; i++) {
                        if (networks[i].observers !== undefined) {
                            for (var j = 0; j < networks[i].observers.length; j++) {
                                observerCol.create(networks[i].observers[j])
                            }
                        }
                        if (networks[i].extractors !== undefined) {
                            for (var k = 0; k < networks[i].extractors.length; k++) {
                                extractorCol.create(networks[i].extractors[k])
                            }
                        }

                        delete networks[i].observers
                        delete networks[i].extractors
                        networkCol.create(networks[i], {success: resolve})
                    }
                }})
            }})
        }})
    })
}

export default {load, update}
