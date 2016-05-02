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

function ExecutionService () {
    let tasks = []

    function schedule (task) {
        for (var i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].name === task.name) {
                console.info('Task exists. Reschedule.')
                tasks.splice(i, 1)
                break
            }
        }

        tasks.push(task)
    }

    function cancel (taskname) {
        for (var i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].name === taskname) {
                tasks.splice(i, 1)
                return
            }
        }

        console.warn('Failed to cancel Task. No such Task as ' + taskname)
    }

    async function runTasks () {
        for (let task of tasks) {
            if ((await task.nextRun()) < Date.now()) {
                await task.run()
            }
        }

        setTimeout(runTasks, 500)
    }

    function startService () {
        runTasks()
    }

    startService()

    return Object.freeze({
        schedule,
        cancel
    })
}

export default ExecutionService
