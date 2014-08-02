/** @module crypto */

/* Requirements */
var jsrsasign = require('jsrsasign'),
    config    = require('./config');

module.exports = {
    /**
     * Generates the SHA1 hash of a message.
     * @param {String} message - The message to be hashed.
     * @returns {String}
     */
    sha1: function sha1(message) {
        // Initialize an instance of the MessageDigest class
        var md = new KJUR.crypto.MessageDigest({
            alg:  "sha1",
            prov: "cryptojs"
        });
        
        // Load message
        md.updateString(message);
        
        // Generate and return hash
        return md.digest();
    },
    /**
     * Verifies the message's claim to authenticity, based on a signature and
     * a certificate.
     * @param {String} message - The message whose authenticity shall be verified.
     * @param {String} signature - The proposed signature of the message.
     * @param {String} certificate - The certificate with which to verify the signature.
     * @returns {Boolean}
     */
    verify: function verify(message, signature, certificate) {
        // Initialize an instance of the Signature class
        var sign = new KJUR.crypto.Signature({
            alg:  "SHA1withRSA",
            prov: "cryptojs/jsrsa"
        });
        
        // Load certificate
        sign.initVerifyByCertificatePEM(certificate);
        
        // Load message
        sign.updateString(message);
        
        // Verify and return result
        return sign.verify(signature);
    }
};
