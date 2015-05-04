let model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('systemConfig'),
  id: '0',
  defaults: {
    autoUpdateIsEnabled: false,
    fileName: 'rose-study-configuration.txt',
    roseCommentsIsEnabled: true,
    roseCommentsRatingIsEnabled: true,
    salt: 'ROSE',
    hashLength: 8,
    repositoryURL: 'https://secure-software-engineering.github.io/rose/test/base.json'
  }
});

export default model;
