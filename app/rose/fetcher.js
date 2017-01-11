import denodeify from 'denodeify'
import kbpgp from 'kbpgp'
import isofetch from 'isomorphic-fetch'

const importFromArmoredPGP = denodeify(kbpgp.KeyManager.import_from_armored_pgp)
const unbox = denodeify(kbpgp.unbox)

function verify (data, sig, key) {
    return importFromArmoredPGP({armored: key}).then((kms) => {
        const ring = new kbpgp.keyring.KeyRing()
        ring.add_key_manager(kms)
        return unbox({
            keyfetch: ring,
            armored: sig,
            data: new Buffer(data)
        })
    }).then((literals) => {
        const ds = literals[0].get_data_signer()
        const km = ds.get_key_manager()
        return km.get_pgp_fingerprint().toString('hex').toLowerCase()
    })
}

function fetch (url, raw = false) {
    return isofetch(url).then((res) => {
        if (res.status >= 200 && res.status < 300) {
            return (raw ? res.text() : res.json())
        } else {
            throw new Error(res.statusText)
        }
    })
}

function signedFetchGenerator (key, fp) {
    return async function signedFetch (fileURL) {
        let [fileText, sigText] = await Promise.all([fetch(fileURL, true), fetch(`${fileURL}.asc`, true)])

        try {
            var fingerprint = await verify(fileText, sigText, key)
        } catch (e) {
            throw e
        }

        if (fingerprint !== fp) {
            throw new Error('Fingerprint Missmatch: ' + fingerprint + ' ≠ ' + fp)
        }
        let jsonFile = JSON.parse(fileText)
        return jsonFile
    }
}

export {fetch, signedFetchGenerator}
