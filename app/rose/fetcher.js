/*
Copyright (C) 2015-2017
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */

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
