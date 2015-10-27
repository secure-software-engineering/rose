import Ember from 'ember';

export default Ember.Route.extend({
	model () {
		return new Promise((resolve, reject) => {
			kango.invokeAsyncCallback('localforage.getItem', 'application-log', (log) => {
				resolve(log)
			})
		})
	}
});
