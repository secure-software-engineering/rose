/*
Copyright (C) 2015
    Oliver Hoffmann <oliverh855@gmail.com>

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

import $ from 'jquery'

import { sha1 as hash } from '../crypto'
import ConfigsModel from '../models/system-config'

let type = 'fb-login'
let login = false
let configs = new ConfigsModel()

let getLatestStatus = function () {
    return new Promise((resolve) => {
        kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
            records = records || []
            let latest = records.pop()

            resolve((latest) ? latest.value : false)
        })
    })
}

let store = function () {
    return new Promise((resolve) => {
        kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
            records = records || []
            records.push({
                type: type,
                date: Date.now(),
                value: login
            })

            kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
                resolve()
            })
        })
    })
}

let checkStatus = async function() {
    let id = $.cookie('c_user')
    let loginTmp = (id) ? hash(id, configs.get('salt'), configs.get('hashLength')) : false

    if (login !== loginTmp) {
        login = loginTmp

        await store()
    }

    setTimeout(checkStatus, 1000)
}

let start = async function() {
    let networkDomain = 'facebook.com'

    if ((new RegExp('^https:\/\/[\w\.\-]*(' + networkDomain.replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {
        login = await getLatestStatus()
        configs.fetch({success: () => {
            checkStatus()
        }})
    }
}

export default {
    start
}
