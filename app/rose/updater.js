import ConfigModel from 'rose/models/system-config'
import ObserverCollection from 'rose/collections/observers'
import ExtractorCollection from 'rose/collections/extractors'
import NetworkCollection from 'rose/collections/networks'
import verify from 'rose/verify.js'
import { Promise } from 'rsvp'

let configs = new ConfigModel()

let cancelUpdate = (msg) => {
  console.log(msg)
  kango.dispatchMessage('update-result', {status: 'failure', msg})
}

let getVerified = (url, key) => {
  let baseFile = fetch(url)
  let baseFileSig = fetch(url + '.asc')

  return Promise.all([baseFile, baseFileSig])
    .then((requests) => {
      return Promise.all(requests.map((request) => request.text()))
    })
    .then((files) => {
      return verify(files[0], files[1], key).then((fingerprint) => {
        if (parseInt(configs.get('fingerprint'), 16) === parseInt(fingerprint, 16)) {
          return files[0]
        } else {
          return Promise.reject(new Error('Fingerprint does not match.'))
        }
      })
    })
}

let update = () => {
  configs.fetch({success: () => {
      let repositoryURL = configs.get('repositoryURL')
      let baseFileUrl = repositoryURL + 'base.json'
      let publicKeyUrl = repositoryURL + 'public.key'

      fetch(publicKeyUrl)
        .then((request) => request.text())
        .then((publicKey) => {
          return getVerified(baseFileUrl, publicKey)
            .then((confData) => {
              confData = JSON.parse(confData);

              if (configs.get('timestamp') >= confData.timestamp) {
                cancelUpdate('All up-to-date')
                return []
              } else {
                configs.set('timestamp', confData.timestamp)

                return new Promise((resolve, reject) => {
                  let networks = new NetworkCollection()
                  networks.fetch({success: () => {
                      let promises = []

                      // iterate through networks that are configured in Rose
                      networks.each((network) => {
                        let remoteNetwork = _.findWhere(confData.networks, {name: network.get('name')})

                        if (remoteNetwork !== undefined) {
                          if (remoteNetwork.observers !== undefined) {
                            // request and verify observer file
                            promises.push(getVerified(confData.url + remoteNetwork.observers, publicKey))
                          }
                          if (remoteNetwork.extractors !== undefined) {
                            // request and verify extractor file
                            promises.push(getVerified(confData.url + remoteNetwork.extractors, publicKey))
                          }
                        }

                        resolve(Promise.all(promises))
                      })
                  }})
                })
              }
            })
        })
        .then((observersExtractors) => {
          if (observersExtractors.length <= 0) {
            return Promise.resolve()
          }

          return new Promise((resolve, reject) => {
            // Update every network by its observers/extractors
            (new ObserverCollection()).fetch({success: (observerCollection) => {
                (new ExtractorCollection()).fetch({success: (extractorCollection) => {
                    let updateCounter = 0

                    // for collection of observers/extractors update
                    observersExtractors.forEach((list) => {
                      if (list[0].type === 'input' || list[0].type === 'click') {
                        updateCounter += updateByVersion(observerCollection, list)
                      } else {
                        updateCounter += updateByVersion(extractorCollection, list)
                      }
                    })

                    // Update sucessful: save and return result
                    configs.save()
                    console.log('Sucessfully updated ' + updateCounter + ' observers/extractors')
                    kango.dispatchMessage('update-result', {status: 'success', updateCounter})

                    resolve()
                }})
            }})
          })
        })
        .catch((error) => {
          cancelUpdate('Verification of base file failed:' + error)
        })
  }})
}

let compareVersion = (oldVersion, newVersion) => {
  var result = false

  oldVersion = oldVersion.split('.')
  newVersion = newVersion.split('.')

  for (var i = 0; i < (Math.max(oldVersion.length, newVersion.length)); i++) {
    if (oldVersion[i] === undefined) { oldVersion[i] = 0; }
    if (newVersion[i] === undefined) { newVersion[i] = 0; }

    if (Number(oldVersion[i]) < Number(newVersion[i])) {
      result = true
      break
    }
    if (oldVersion[i] !== newVersion[i]) {
      break
    }
  }
  return result
}

let updateByVersion = (collection, newCollection) => {
  let updateCounter = 0
  collection.each((model) => {
    let remoteModel = _.findWhere(newCollection, {name: model.get('name'), network: model.get('network')})
    if (remoteModel !== undefined && compareVersion(model.get('version'), remoteModel.version)) {
      model.save(remoteModel)
      updateCounter++
    }
  })
  return updateCounter
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

export default {update, load}
