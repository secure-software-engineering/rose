import test from 'ava'

import JSData from 'js-data'
import DSLocalstorageAdapter from 'js-data-localstorage'

let memory = {}
let memoryAdapter = new DSLocalstorageAdapter({
    storage: {
        getItem (key) {
            return memory[key]
        },
        setItem (key, value) {
            return memory[key] = value
        },
        removeItem (key) {
            delete memory[key]
        }
    }
})
global.store = new JSData.DS()
global.store.registerAdapter('memory', memoryAdapter, { default: true })
global.store.defineResource('traker-record')

import ClickTracker from '../app/rose/activity-tracker'
import { onClickHandler } from '../app/rose/activity-tracker'

test.beforeEach(() => {
    memory = {}
})

test.serial('click', (t) => {
    return onClickHandler()
        .then(() => store.findAll('traker-record'))
        .then(records => {
            console.log(records)
            t.ok(records.length === 1)
        })
})

// test.serial('2 clicks', (t) => {
//     return onClickHandler()
//         .then(() => onClickHandler())
//         .then(() => store.findAll('traker-record'))
//         .then(records => t.ok(records.length === 1))
// })
