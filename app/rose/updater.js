import ConfigModel from 'rose/models/system-config'
import ObserverCollection from 'rose/collections/observers'
import ExtractorCollection from 'rose/collections/extractors'
import NetworkCollection from 'rose/collections/networks'
import verify from 'rose/verify.js'

function removeFileName (str) {
  return str.substring(0, str.lastIndexOf("/"));
}

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
            success: (model, response, options) => resolve(response),
            error: (model, response, options) => reject(response)
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
        if (observer.version > model.get('version')){
          model.save(observer, {
            success: (model, response, options) => resolve(response),
            error: (model, response, options) => reject(response)
          })
        } else {
          resolve()
        }
      }
    })
  })
}

export async function update () {
  const config = new ConfigModel()

  return new Promise((resolve) => {
    config.fetch({
      success: async (model, response, options) => {
        const baseFileUrl = model.get('repositoryURL')
        const baseFileSigUrl = `${baseFileUrl}.asc`
        const fingerprint = model.get('fingerprint').toLowerCase()
        const repositoryUrl = removeFileName(baseFileUrl)
        const publicKeyUrl = `${repositoryUrl}/public.key`

        const baseFileText = await fetch(baseFileUrl).then(res => res.text())
        const baseFileSigText = await fetch(baseFileSigUrl).then(res => res.text())
        const publicKeyText = await fetch(publicKeyUrl).then(res => res.text())

        const signer = await verify(baseFileText, baseFileSigText, publicKeyText)

        if (fingerprint !== signer) {
          throw new Error('Fingerprint Missmatch')
        }

        const baseFile = JSON.parse(baseFileText)

        let stats = []

        if (baseFile.networks) {
          let networks = baseFile.networks.filter((network) => {
            return network.observers || network.extractors
          })

          for (let network of networks) {
            let networkStats = {
              name: network.name,
              updatedExtractors: [],
              updatedObservers: []
            }

            if (network.extractors) {
              const extractorsText = await fetch(`${repositoryUrl}/${network.extractors}`).then(res => res.text())
              const extractorsSigText = await fetch(`${repositoryUrl}/${network.extractors}.asc`).then(res => res.text())

              if (validate(extractorsText, extractorsSigText, publicKeyText, fingerprint)) {
                const extractors = JSON.parse(extractorsText)
                for (let extractor of extractors) {
                  let updatedExtractor = await updateExtractor(extractor)
                  if (updatedExtractor) networkStats.updatedExtractors.push(extractor.name)
                }
              }
            }

            if (network.observers) {
              const observersText = await fetch(`${repositoryUrl}/${network.observers}`).then(res => res.text())
              const observersSigText = await fetch(`${repositoryUrl}/${network.observers}.asc`).then(res => res.text())

              if (validate(observersText, observersSigText, publicKeyText, fingerprint)) {
                const observers = JSON.parse(observersText)
                for (let observer of observers) {
                  let updatedObserver = await updateObserver(observer)
                  if (updatedObserver) networkStats.updatedObservers.push(observer.name)
                }
              }
            }

            stats.push(networkStats)
          }
        }

        config.set('lastChecked', new Date().getTime()).save()

        resolve(stats)
      }
    })
  })
}

async function validate(data, sig, key, fp) {
  const fingerprint = await verify(data, sig, key)
  if (fingerprint.toLowerCase() === fp.toLowerCase()) {
    return true
  } else {
    console.log('Fingerprint Missmatch')
    return false
  }
}

let load = (networks) => {

  return new Promise((resolve) => {
    (new NetworkCollection()).fetch({success: (networkCol) => {
        (new ObserverCollection()).fetch({success: (observerCol) => {
            (new ExtractorCollection()).fetch({success: (extractorCol) => {
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
                  networkCol.create(networks[i], {success: () => {
                    resolve()
                  }})
                }
            }})
        }})
    }})
  });
}

export default {load, update}
