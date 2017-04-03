import Ember from 'ember'
import FilePicker from 'ember-cli-file-picker/components/file-picker'

export default FilePicker.extend({
  classNameBindings: ['isEnabled:enabled:disabled'],
  isEnabled: true,
  layoutName: 'ember-cli-file-picker/components/file-picker'
})
