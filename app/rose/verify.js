import { denodeify } from 'rsvp'
import kbpgp from 'kbpgp'

const import_from_armored_pgp = denodeify(kbpgp.KeyManager.import_from_armored_pgp)
const unbox = denodeify(kbpgp.unbox)

function verify (data, sig, key) {
  return import_from_armored_pgp({raw: key}).then((kms) => {
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
    return km.get_pgp_fingerprint().toString('hex')
  })
}

export default verify
