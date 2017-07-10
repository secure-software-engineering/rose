/* /*
Copyright (C) 2016-2017
    Oliver Hoffmann <oliverh855@gmail.com>
    Felix A. Epp <work@felixepp.de>

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
import Ember from 'ember'

function shortenPx (pixels) {
  return (pixels > 9999 ? Math.floor(pixels / 1000) + 'k' : pixels) + ' px'
}

export default Ember.Component.extend({
  tagName: 'td',
  classNames: ['right', 'aligned'],

  count: Ember.computed('data', function () {
    const data = this.get('data')
    const network = this.get('network')

    let filtered = []
    let sum = 0
    switch (this.get('type')) {
      case 'comments':
        if (network === 'facebook') {
          sum = data.filterBy('network', network).length
        } else {
          sum = ''
        }
        break
      case 'interactions':
      case 'extracts':
        sum = data.filterBy('origin.network', network).length
        break
      case 'clicks':
        filtered = data.filter(activity => activity.network === network)
        sum = filtered.reduce((sum, activity) => sum + activity.value, 0)
        break
      case 'mousemoves':
      case 'scroll':
        filtered = data.filter(activity => activity.network === network)
        sum = shortenPx(filtered.reduce((sum, activity) => sum + activity.value, 0))
        break
      case 'logins':
        if (network === 'facebook') {
          sum = data.filter(activity => {
            return activity.network === network && activity.value !== false
          }).length
        } else {
          sum = ''
        }
        break
      case 'windows':
        sum = data.filter(activity => {
          return activity.value.network === network && activity.value.open && activity.value.active
        }).length
        break
    }
    return sum
  })
})
