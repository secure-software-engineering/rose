let model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('systemConfig'),
  id: '0',
  defaults: {
      salt: 'ROSE',
      autoUpdateObserver: true,
      hashLength: 8,
      commentsIsEnabled: true,
      ratingsIsEnabled: true,
      repositoryURL: 'https://secure-software-engineering.github.io/rose/test/base.json'
  }
});

export default model;
