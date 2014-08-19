import Ember from 'ember';

var Router = Ember.Router.extend({
    location: PopupENV.locationType
});

Router.map(function() {
    this.route('about');
    this.route('backup');
    this.route('diary');
    this.route('documentation');
    this.route('settings');
    this.resource('facebook', function() {
        this.route('interactions');
        this.route('comments');
        this.route('privacy');
    });
    this.resource('google', function() {
        this.route('interactions');
        this.route('comments');
        this.route('privacy');
    });
});

export default Router;
