/*
Copyright (C) 2015
    Oliver Hoffmann <oliverh855@gmail.com>
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
let model = Backbone.Model.extend({
    sync: Backbone.kangoforage.sync('systemConfig'),
    id: '0',
    defaults: {
        autoUpdateIsEnabled: false,
        timestamp: 0,
        fileName: 'base.json',
        roseCommentsIsEnabled: true,
        roseCommentsRatingIsEnabled: true,
        salt: 'ROSE',
        hashLength: 5,
        repositoryURL: 'https://secure-software-engineering.github.io/rose/example/',
        fingerprint: '25E769C697EC2C20DA3BDDE9F188CF170FA234E8'
    }
})

export default model
