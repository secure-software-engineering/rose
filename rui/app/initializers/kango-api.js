export function initialize(application) {
  application.deferReadiness();

  KangoAPI.onReady(function() {
    application.advanceReadiness();
  });
}

export default {
  name: 'kango-api',
  initialize: initialize
};
