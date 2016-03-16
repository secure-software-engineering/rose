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
but WITHOUT ANY WARRANTY without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */

import localforage from 'localforage'

import DS from './rose/storage'
import storageMessageHandler from './rose/message-handlers/storage'

const executionService = ExecutionService()
const store = DS.getStoreFor('background-script')

kango.addMessageListener('channel:storage', storageMessageHandler)

import log from './rose/log'
import ExtractorEngine from './rose/extractor-engine'
import Updater from './rose/updater'

import WindowTracker from './rose/activity-trackers/window'

import ExecutionService from './rose/execution-service'
import Task from './rose/task'

/* Background Script */
(async function() {
    const installDate = await localforage.getItem('install-date')
    if (!installDate) {
        await localforage.setItem('install-date', new Date().toJSON())
        kango.ui.optionsPage.open()
    }

    const roseDataVersion = await localforage.getItem('rose-data-version')
    if (!roseDataVersion) {
        await localforage.setItem('rose-data-version', '2.0')
    }

    const roseVersion = await localforage.getItem('rose-version')
    if (!roseVersion || roseVersion < '3.0.0') {
        await localforage.setItem('rose-version', '3.0.0')
    }

    WindowTracker.start()
    startExtractorEngine()
})()

// //////////////
// Scheduling //
// //////////////

store.find('system-config', { id: 0 })
    .then((config) => {
        executionService.schedule(Task({
            name: 'updater',
            rate: config.updateInterval,
            job: Updater.update
        }))
    })

function startExtractorEngine () {
    return Promise.all([
        store.findAll('extractor'),
        store.findAll('extract'),
        store.find('system-config', { id: 0 })
    ]).then((responses) => {
        const ee = new ExtractorEngine({
            extractor: responses[0],
            extract: responses[1],
            config: responses[2],
            store: store
        })
        ee.register((extractor, interval, job) => {
            executionService.schedule(Task({
                name: extractor,
                rate: interval,
                job: job
            }))
        })
    })
}

// /////////////
// Messaging //
// /////////////

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function (event) {
    kango.ui.optionsPage.open()
})

kango.addMessageListener('update-start', () => {
    Updater.update()
    .then((statistics) => {
        log('Updater', JSON.stringify(statistics))
    })
    .then(() => kango.dispatchMessage('update-successful'))
    .catch(() => kango.dispatchMessage('update-successful'))
})

kango.addMessageListener('LoadNetworks', (event) => {
    Updater.load(event.data).then(() => {
        startExtractorEngine()
    })
})

kango.addMessageListener('application-log', async (event) => {
    const applicationLog = await localforage.getItem('application-log') || []
    const log = { date: new Date().getTime() }

    applicationLog.push(Object.assign(log, event.data))
    await localforage.setItem('application-log', applicationLog)
})
