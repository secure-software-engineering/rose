import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
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
