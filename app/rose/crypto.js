/** @module crypto */

/* Requirements */
import SystemConfigModel from 'rose/models/system-config';

export default {
    /**
     * Generates the SHA1 hash of a message.
     * @param {String} message - The message to be hashed.
     * @returns {String}
     */
    sha1: function sha1(message) {
        var configs = new SystemConfigModel();
        configs.fetch();
        var md = forge.md.sha1.create();
        var salt = configs.get('salt');
        md.update(salt + message);
        var hash = md.digest().toHex();

        return hash.slice(0, configs.get('hashLength'));
    },
    /**
     * Verifies the message's claim to authenticity, based on a signature and
     * a certificate.
     * @param {String} message - The message whose authenticity shall be verified.
     * @param {String} signature - The proposed signature of the message.
     * @param {String} certificate - The certificate with which to verify the signature.
     * @returns {Boolean}
     */
    // verify: function verify(message, signature, certificate) {
    //     // Initialize an instance of the Signature class
    //     var sign = new sec.Signature({
    //         alg:  "SHA1withRSA",
    //         prov: "cryptojs/jsrsa"
    //     });

    //     // Load certificate
    //     sign.initVerifyByCertificatePEM(certificate);

    //     // Load message
    //     sign.updateString(message);

    //     // Verify and return result
    //     return sign.verify(signature);
    // }
};
