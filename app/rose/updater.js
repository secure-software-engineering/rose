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

      if (baseFile.networks) {
        baseFile.networks
          .filter(network => network.observers || network.extractors)
          .forEach(async network => {
            if (network.extractors) {
              const extractorsText = await fetch(`${repositoryUrl}/${network.extractors}`).then(res => res.text())
              const extractorsSigText = await fetch(`${repositoryUrl}/${network.extractors}.asc`).then(res => res.text())

              if (validate(extractorsText, extractorsSigText, publicKeyText, fingerprint)) {
                const extractors = JSON.parse(extractorsText)
                extractors.forEach(async extractor => {
                  await updateExtractor(extractor)
                })
              }
            }

            if (network.observers) {
              const observersText = await fetch(`${repositoryUrl}/${network.observers}`).then(res => res.text())
              const observersSigText = await fetch(`${repositoryUrl}/${network.observers}.asc`).then(res => res.text())

              if (validate(observersText, observersSigText, publicKeyText, fingerprint)) {
                const observers = JSON.parse(observersText)
                observers.forEach(async observer => {
                  await updateObserver(observer)
                })
              }
            }
          })
      }
    }
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
                // call extractorEngine to start
                }

                delete networks[i].observers
                delete networks[i].extractors
                networkCol.create(networks[i])
              }
          }})
      }})
  }})
}

export default {load, update}
