/*
Copyright (C) 2015-2017
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

import localforage from 'localforage'

function Task (spec) {
    let { name, job, rate } = spec

    async function lastRun () {
        let lastR = JSON.parse(await localforage.getItem(name + '-last-run'))
        if (lastR === null) {
            return setLastRun()
        }
        return lastR
    }

    async function setLastRun () {
        return (await localforage.setItem(name + '-last-run', Date.now()))
    }

    async function nextRun () {
        return (await lastRun()) + rate
    }

    async function run () {
        job()
        setLastRun()
    }

    return Object.freeze({
        lastRun,
        nextRun,
        run,
        name
    })
}

export default Task
