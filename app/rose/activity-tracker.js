import $ from 'jquery'
import _last from 'lodash/last'

export function onClickHandler () {
    return store.findAll('traker-record', { type: 'click' })
        .then((recordss) => {
            console.log(_last(recordss))
            return _last(recordss)
        })
        .then(lastRecord => {
            console.log(lastRecord)
            if (!lastRecord || (Date.now() - lastRecord.createdAt) > this.period) {
                return store.create('traker-record', {
                    type: 'click',
                    value: 0,
                    createAt: Date.now()
                })
            }

            return lastRecord
        })
        .then(lastRecord => {
            const value = lastRecord.value + 1
            return store.update('traker-record', lastRecord.id, { value: value })
        })
}

export default class ClickTracker {
    constructor (element) {
        this.element = element
        this.period = 3600000
    }

    bindTo (element) {
        this.element = element
    }

    start () {
        $(this.element).on('click', onClickHandler.bind(this))
    }

    stop () {
        $(this.element).off('click', onClickHandler.bind(this))
    }
}
