/*
Copyright (C) 2015
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

export default {
    /**
     * Generates the SHA1 hash of a message.
     * @param {String} message - The message to be hashed.
     * @returns {String}
     */
    sha1: function sha1(message, salt, hashLength) {
        let md = forge.md.sha1.create()
        md.update(salt + message)
        let hash = md.digest().toHex()

        return hash.slice(0, hashLength)
    }
}
