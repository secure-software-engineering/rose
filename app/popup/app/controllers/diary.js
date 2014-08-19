import Ember from 'ember';

export default Ember.Controller.extend({
    newEntry: null,
    failure: false,

    diarySort: ['createdAt:desc'],
    sortedDiary: Ember.computed.sort('diary', 'diarySort'),

    diary: [
        Ember.Object.create({
            id: 0,
            createdAt: new Date().toJSON(),
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minima officia nesciunt necessitatibus nobis at veritatis blanditiis inventore architecto aliquid dolorem est velit, aliquam eaque minus, neque, possimus, in sunt modi.",
            hidden: false,
            deleted: false
        }),
        Ember.Object.create({
            id: 1,
            createdAt: new Date().toJSON(),
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minima officia nesciunt necessitatibus nobis at veritatis blanditiis inventore architecto aliquid dolorem est velit, aliquam eaque minus, neque, possimus, in sunt modi.",
            hidden: false,
            deleted: false
        }),
        Ember.Object.create({
            id: 2,
            createdAt: new Date().toJSON(),
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minima officia nesciunt necessitatibus nobis at veritatis blanditiis inventore architecto aliquid dolorem est velit, aliquam eaque minus, neque, possimus, in sunt modi.",
            hidden: false,
            deleted: false
        })
    ],

    actions: {
        cancel: function() {
            this.set('newEntry', '');
            this.set('failure', false);
        },
        save: function() {
            if(Ember.empty(this.get('newEntry'))) {
                this.set('failure', true);
                return;
            }

            this.set('failure', false);

            var values = {
                id: this.diary.length,
                createdAt: new Date().toJSON(),
                text: this.get('newEntry')
            };
            var entry = Ember.Object.create(values);
            this.diary.pushObject(entry);
            this.set('newEntry', '');
        },
        hide: function(entry) {
            entry.set('hidden', !entry.get('hidden'));
        },
        delete: function(entry) {
            entry.set('deleted', true);
            entry.set('text', '');
        }
    }
});
