import fetch from 'isomorphic-fetch'

import ConfigModel from './models/system-config'
import ObserverCollection from './collections/observers'
import ExtractorCollection from './collections/extractors'
import NetworkCollection from './collections/networks'
import verify from './verify.js'

/**
 * TODO:
 * * Rework the await fetch() expression, because 404 are not caught
 * * Rewrite updateExtractor and UpdateObserver so they don't fetch the storage every f***kin item in the repo.
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

function validator (key, fp) {
    fp = fp.toLowerCase()
    return async function (data, sig) {
        let fingerprint

        try {
            fingerprint = await verify(data, sig, key)
        } catch (e) {
            throw new VerificationException('Data could not be verified!')
        }

        return (fingerprint.toLowerCase() === fp)
    }
}

function SigningException (message) {
    this.message = message
    this.name = 'SigningException'
}

function signedFetch (key, fp) {
    let validate = validator(key, fp)

    return async function (fileURL) {
        let fileText = await fetch(fileURL).then((res) => res.text())
        let sigText = await fetch(`${fileURL}.asc`).then((res) => res.text())

        if (await !validate(fileText, sigText)) {
            throw new SigningException('Fingerprint Missmatch')
        }
        let jsonFile = JSON.parse(fileText)
        return jsonFile
    }
}

function unsignedFetch (reject) {
    return async function (fileURL) {
        let fileText = await fetch(fileURL).then((res) => res.text())
        let jsonFile = JSON.parse(fileText)
        return jsonFile
    }
}

async function fetchRepository (config, reject) {
    const baseFileUrl = config.get('repositoryURL')
    const repositoryUrl = baseFileUrl.substring(0, baseFileUrl.lastIndexOf('/'))

    // Generate a fetch function to reuse
    // Either with validation or without
    let fetchJSONFile
    if (config.get('forceSecureUpdate') && config.get('secureUpdateIsEnabled')) {
        let publicKeyText = await fetch(`${repositoryUrl}/public.key`).then((res) => res.text())
        let fingerprint = config.get('fingerprint').toLowerCase()
        fetchJSONFile = signedFetch(publicKeyText, fingerprint)
    } else {
        fetchJSONFile = unsignedFetch()
    }

    //  basefile download
    let baseFile
    try {
        baseFile = await fetchJSONFile(baseFileUrl)
    } catch (e) {
        reject(e)
        return
    }
    let repository = []

    new NetworkCollection().fetch({success: async (localNetworks) => {
        await localNetworks.each(async (localNetwork) => {
            let network = baseFile.networks.find((nw) => nw.name === localNetwork.get('name'))
            let networkIndex = repository.push({name: network.name, extractors: [], observers: []}) - 1

            if (network.extractors) {
                try {
                    repository[networkIndex].extractors = await fetchJSONFile(`${repositoryUrl}/${network.extractors}`)
                } catch (e) {
                    reject(e)
                    return
                }
            }

            if (network.observers) {
                try {
                    repository[networkIndex].observers = await fetchJSONFile(`${repositoryUrl}/${network.observers}`)
                } catch (e) {
                    reject(e)
                    return
                }
            }
        })

        return repository
    }})
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
                let repository = await fetchRepository(config, reject)

                // update contents in storage
                let stats = await updateChanges(config, repository)

                config.set('lastChecked', Date.now()).save()

                if (stats.some((network) => network.updatedExtractors.length + network.updatedObservers.length > 0)) {
                    config.set('lastUpdated', Date.now()).save()
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
