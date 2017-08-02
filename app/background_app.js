/*
Copyright (C) 2015-2017
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

import localforage from 'localforage'

import log from './rose/log'
import ExtractorEngine from './rose/extractor-engine'
import ExtractorCollection from './rose/collections/extractors'
import SystemConfig from './rose/models/system-config'
import UserSettings from './rose/models/user-settings'
import NetworkCollection from './rose/collections/networks'
import Updater from './rose/updater'
import Doctor from './rose/doctor'

import WindowTracker from './rose/activity-trackers/window'

import ExecutionService from './rose/execution-service'
import Task from './rose/task'

/* Initialization */

(async function () {
    const installDate = await localforage.getItem('install-date')
    if (!installDate) {
        await localforage.setItem('install-date', Date.now())
        kango.ui.optionsPage.open()
    }

    const roseDataVersion = await localforage.getItem('rose-data-version')
    if (!roseDataVersion) {
        await localforage.setItem('rose-data-version', '2.0')
    }

    const roseVersion = await localforage.getItem('rose-version')
    if (!roseVersion || roseVersion < '3.0.5') {
        await localforage.setItem('rose-version', '3.0.5')
    }

    scheduleAutoUpdate()

    new UserSettings().fetch({ success: (settings) => {
        if (settings.get('trackingEnabled')) {
            scheduleExtractors()
            scheduleActivityTrackers()
        }
    }})
})()

/* Scheduling */

const executionService = ExecutionService()
let windowTrackers = []
let extractorEngine

function scheduleAutoUpdate () {
    new SystemConfig().fetch({ success: (config) => {
        if (config.get('repositoryURL') && config.get('autoUpdateIsEnabled')) {
            executionService.schedule(Task({
                name: 'updater',
                rate: config.get('updateInterval'),
                job: Updater.update
            }))
        }
    }})
}

function scheduleExtractors () {
    new ExtractorCollection().fetch({success: (extractorCol) => {
        if (extractorCol.length) {
            extractorEngine = new ExtractorEngine(extractorCol)
            extractorEngine.register(function (extractor, interval, job) {
                executionService.schedule(Task({
                    name: extractor,
                    rate: interval,
                    job: job
                }))
            })
        }
    }})
}

function scheduleActivityTrackers () {
    new NetworkCollection().fetch({success: (networks) => {
        networks.forEach((network) => {
            let windowTracker = new WindowTracker(network)
            windowTrackers.push(windowTracker)
            windowTracker.start()
        })
    }})
}

Doctor.repairMissingInteractions()
executionService.schedule(Task({
    name: 'repairInteractions',
    rate: 3600000,
    job: Doctor.repairMissingInteractions
}))

/* Messaging */
function sendToAllTabs (event, msg) {
    kango.browser.tabs.getAll((tabs) => {
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].dispatchMessage(event, msg)
        }
    })
}

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function (event) {
    kango.ui.optionsPage.open()
})

kango.addMessageListener('reschedule-auto-update', () => {
    executionService.cancel('updater')
    scheduleAutoUpdate()
})

kango.addMessageListener('update-start', (evt) => {
    Updater.update()
    .then(async (statistics) => {
        // FIXME: should not tamper in localstorage manage by execution service from here
        await localforage.setItem('updater-last-run', JSON.stringify(Date.now()))
        if (statistics !== '') {
            statistics = statistics.reduce((msg, network) => {
                return msg + network.name + ': ' + network.updatedObservers.concat(network.updatedExtractors).join(', ')
            }, '')
            scheduleExtractors() // reschedule Extractors, for eventual interval changes
        } else {
            statistics = 'uptodate'
        }
        log('Updater', JSON.stringify(statistics))
        return statistics
    })
    .then((status) => evt.target.dispatchMessage('update-successful', status))
    .catch((err) => evt.target.dispatchMessage('update-unsuccessful', err))
})

kango.addMessageListener('LoadNetworks', (event) => {
    Updater.load(event.data).then(() => {
        scheduleExtractors()
        scheduleAutoUpdate()
        scheduleActivityTrackers()
    })
})

kango.addMessageListener('application-log', async (event) => {
    const applicationLog = await localforage.getItem('application-log') || []
    const log = { date: Date.now() }

    applicationLog.push(Object.assign(log, event.data))
    await localforage.setItem('application-log', applicationLog)
})

kango.addMessageListener('reset-configuration', () => {
    executionService.cancel('updater')
    while (extractorEngine.scheduled.length) {
        executionService.cancel(extractorEngine.scheduled.pop())
    }
})

kango.addMessageListener('toggle-tracking', () => {
    new UserSettings().fetch({ success: (settings) => {
        if (settings.get('trackingEnabled')) {
            scheduleExtractors()
            scheduleActivityTrackers()
            sendToAllTabs('toggle-tracking', true)
        } else {
            while (extractorEngine.scheduled.length) {
                executionService.cancel(extractorEngine.scheduled.pop())
            }
            windowTrackers = []
            sendToAllTabs('toggle-tracking', false)
        }
    }})
})
