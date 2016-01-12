import Ember from 'ember';

export default Ember.Route.extend({
    model () {
        let debugLog = []
        
        return new Promise((resolve, reject) => {
            kango.invokeAsyncCallback('localforage.getItem', 'application-log', (log) => {
                log.forEach(item => debugLog.push(item))
                resolve(debugLog.reverse())
            })
        })
    }
});
