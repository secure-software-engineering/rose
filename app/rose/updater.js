import ConfigModel from './models/system-config'
import ObserverCollection from './collections/observers'
import ExtractorCollection from './collections/extractors'
import NetworkCollection from './collections/networks'
import {fetch, signedFetchGenerator} from './fetcher'

async function fetchRepository (config) {
    const baseFileUrl = config.get('repositoryURL')
    const repositoryUrl = baseFileUrl.substring(0, baseFileUrl.lastIndexOf('/'))

    // Generate a fetch function to reuse
    // Either with validation or without
    let fetchJSONFile
    if (config.get('forceSecureUpdate') || config.get('secureUpdateIsEnabled')) {
        let publicKeyText = await fetch(`${repositoryUrl}/public.key`, true)
        let fingerprint = config.get('fingerprint').toLowerCase()
        fetchJSONFile = signedFetchGenerator(publicKeyText, fingerprint)
    } else {
        fetchJSONFile = fetch
    }

    // basefile download
    let baseFile = await fetchJSONFile(baseFileUrl)

    return new Promise((resolve, reject) => {
        new NetworkCollection().fetch({success: async (localNetworks) => {
            let repository = []
            try {
                for (let network of baseFile.networks) {
                    if (!localNetworks.models.some((nwmodel) => nwmodel.get('name') === network.name)) {
                        continue
                    }
                    let networkIndex = repository.push({name: network.name, extractors: [], observers: []}) - 1

                    if (network.extractors) {
                        repository[networkIndex].extractors = await fetchJSONFile(`${repositoryUrl}/${network.extractors}`)
                    }

                    if (network.observers) {
                        repository[networkIndex].observers = await fetchJSONFile(`${repositoryUrl}/${network.observers}`)
                    }
                }
            } catch (e) {
                return reject(e)
            }
            resolve(repository)
        }})
    })
}

function updateTracker (tracker, collection) {
    return new Promise((resolve, reject) => {
        const model = collection.findWhere({
            name: tracker.name,
            network: tracker.network
        })
        if (!model) return resolve()
        if (tracker.version > model.get('version')) {
            model.save(tracker, {
                success: (model, response) => resolve(response),
                error: (model, response) => reject(response)
            })
        } else {
            resolve()
        }
    })
}

function fetchCol (Collection) {
    return new Promise((resolve) => {
        new Collection().fetch({success: (col) => resolve(col)})
    })
}

async function updateChanges (config, networks) {
    const stats = []
    const [observerCol, extractorCol] = await Promise.all([fetchCol(ObserverCollection), fetchCol(ExtractorCollection)])

    for (let network of networks) {
        let networkStats = {
            name: network.name,
            updatedExtractors: [],
            updatedObservers: []
        }

        for (let extractor of network.extractors) {
            let updatedExtractor = await updateTracker(extractor, extractorCol)
            if (updatedExtractor) networkStats.updatedExtractors.push(extractor.name)
        }

        for (let observer of network.observers) {
            let updatedObserver = await updateTracker(observer, observerCol)
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
                    var repository = await fetchRepository(config)
                } catch (e) {
                    console.error(e)
                    return reject(e)
                }

                // update contents in storage
                let stats = await updateChanges(config, repository)

                await config.set('lastChecked', Date.now()).save()

                if (stats.some((network) => (network.updatedExtractors.length + network.updatedObservers.length) > 0)) {
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
