let model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('userSetting'),
  id: '0',
  defaults: {
    commentReminderIsEnabled: true,
    currentLanguage: 'auto',
    developerModeIsEnabled: false,
  }
});

export default model;
