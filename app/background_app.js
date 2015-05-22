import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import observersCollection from 'rose/collections/observers';

/**
 * Hard coded observers for testing
 * Should be removed when connected to updater
 */
var obs = [{
  name: 'UpdateStatus',
  network: 'facebook',
  type: 'click',
  priority: 3,
  version: '0.1',
  patterns: [
    {
      node: 'form[action*=updatestatus] button[type=submit]',
      container: 'form[action*=updatestatus]'
    }
  ]
},
{
  name: 'LikeContent',
  network: 'facebook',
  type: 'click',
  priority: 1,
  version: '0.2',
  patterns: [
    {
      node: '.UFILikeLink span',
      container: '.userContentWrapper',
      extractor: 'StatusUpdate'
    }
  ]
},
{
  name: 'ViewProfile',
  network: 'facebook',
  type: 'click',
  priority: 2,
  version: '0.2',
  patterns: [
    {
      node: 'a.friendHovercard * , a[data-hovercard*="user"] *, a[href*="=ufi"] *, a.titlebarText, a[href*="=ufi"][data-hovercard], a[data-hovercard*="user"]',
      container: 'a',
      extractor: 'UserLink'
    }
  ]
},
{
  name: 'FriendRequestAdd',
  network: 'facebook',
  type: 'click',
  priority: 4,
  version: '0.1',
  patterns: [
    {//friend currently viewed profile
      node: '.stickyHeaderWrap .button.FriendRequestAdd, .stickyHeaderWrap button.FriendRequestAdd *, .uiBoxWhite .button.FriendRequestAdd, .uiBoxWhite button.FriendRequestAdd *',
      container: '#globalContainer'
    },
    {//recommended friends browser list (blue top bar)
      node: '.friendBrowserListUnit button.FriendRequestAdd, .friendBrowserListUnit button.FriendRequestAdd *',
      container: '.uiProfileBlockContent'
    },
    {//user hovercard
      node: '.hovercardButtonGroup button.FriendRequestAdd, .hovercardButtonGroup button.FriendRequestAdd *',
      container: '.uiContextualLayer > div > div > i + div'
    },
    {//list of a fbusers friends profiletab:friends
      node: 'button.FriendRequestAdd, button.FriendRequestAdd *',
      container: '.clearfix'
    }
  ]
},
{
  name: 'Unfriend',
  network: 'facebook',
  type: 'click',
  priority: 7,
  version: '0.1',
  patterns: [
    {//friend currently viewed profile
      node: '.FriendListUnfriend *',
      container: '#globalContainer'
    },
    {//hovercard not yet read yfor extraction
      node: '.FriendListUnfriend *',
      container: 'willö never be reached'
    }
  ]
},
{
  name: 'FriendRequestConfirm',
  network: 'facebook',
  type: 'click',
  priority: 5,
  version: '0.1',
  patterns: [
    {//friend currently viewed profile
      node: '.requestStatus button[name="actions[accept]"]',
      container: '.requestStatus'
    },
    {//reject on profile
      node: '#pagelet_above_header_timeline a[role="button"][ajaxify*="add_friend"], .stickyHeaderWrap a[role="button"][ajaxify*="add_friend"], .requestResponseMenu li.accept *',
      container: '#globalContainer'
    }
  ]
},
{
  name: 'FriendRequestReject',
  network: 'facebook',
  type: 'click',
  priority: 6,
  version: '0.1',
  patterns: [
    {//friend currently viewed profile
      node: '.requestStatus button[name="actions[reject]"]',
      container: '.requestStatus'
    },
    {//reject on profile
      node: '#pagelet_above_header_timeline a[role="button"][ajaxify*="reject"], .stickyHeaderWrap a[role="button"][ajaxify*="reject"], .requestResponseMenu li.reject *',
      container: '#globalContainer'
    }

  ]
}];



/* Background Script */
(function() {

  //Write test observe into storage
  //FIX: Updater loads observers
  var observers = new observersCollection();
  observers.fetch({ success: function(col) {
    log('CoreBGScript', 'Observers loaded from storage');
    if (observers.length === 0) {
      for (var i = 0; i < obs.length; i++) {
        observers.create(obs[i]);
      }
    }
    // //Load one observer new into storage each refresh
    // var crtObserver = col.findWhere({name: 'UpdateStatus'});
    // crtObserver.set(obs[0]);
    // crtObserver.save();
  }});

  /*
   * Extractor Engine
   * ----------------
   *
   * Start extractor engine and integrate with Heartbeat.
   */

   ExtractorEngine.add({
    network: 'Facebook',
    name: 'privacy-settings',
    informationUrl: 'https://www.facebook.com/settings/?tab=privacy',
    interval : 5000
  });

  ExtractorEngine.register();
})();

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(event) {
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
});
