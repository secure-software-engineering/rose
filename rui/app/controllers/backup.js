/*
Copyright (C) 2015-2016
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
import Ember from 'ember';

export default Ember.Controller.extend({
  jsonData: function() {
    let result = {};

    var models = this.get('model');

    models.forEach(function (model) {
      result[model.type] = model.data;
    });

    result['export-date'] = Date.now();

    return JSON.stringify(result, null, 4);
  }.property('model'),

  actions: {
    openModal: function(name) {
      Ember.$('.ui.' + name + '.modal').modal('show');
    },

    download: function () {
      window.saveAs(new Blob([this.get('jsonData')]), 'rose-data.txt');
    },

    approveModal() {
      [
        'comment',
        'interaction',
        'extract',
        'diary-entry'
      ].forEach((type) => this.store.findAll(type).then((records) => records.invoke('destroyRecord')));

      [
        'click',
        'fb-login',
        'mousemove',
        'scroll',
        'window'
      ].forEach((type) => kango.invokeAsyncCallback('localforage.removeItem', type + '-activity-records'));

      return true;
    }
  }
});
