import 'babelify/polyfill';

import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import ObserverCollection from 'rose/collections/observers';
import ExtractorCollection from 'rose/collections/extractors';

import WindowTracker from 'rose/activity-trackers/window';

/**
 * Hard coded observers for testing
 * Should be removed when connected to updater
 */
var observers = [
{
  name: 'like-comment',
  network: 'facebook',
  type: 'click',
  priority: 1,
  version: '0.2',
  patterns: [
    {
      node: '.UFICommentActions .UFILikeLink:contains("Unlike"), .UFICommentActions .UFILikeLink:contains("Gefällt mir nicht mehr")',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},{
  name: 'like-content',
  network: 'facebook',
  type: 'click',
  priority: 2,
  version: '0.2',
  patterns: [
    {
      node: '.UFILikeLink span:contains("Unlike"), .UFILikeLink span:contains("Gefällt mir nicht mehr")',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},{
  name: 'like-photo',
  network: 'facebook',
  type: 'click',
  priority: 2,
  version: '0.2',
  patterns: [
    {
      node: '.fbPhotosPhotoLike span.like',
      container: '.fbPhotoSnowliftPopup'
    },{
      node: '.UFILikeLink span:contains("Unlike"), .UFILikeLink span:contains("Gefällt mir nicht mehr")',
      container: '#fbPhotoPageContainer'
    },{
      node: '.UFILikeLink span:contains("Unlike"), .UFILikeLink span:contains("Gefällt mir nicht mehr")',
      container: '.fbPhotoSnowliftPopup'
    }
  ]
},{
  name: 'like-page',
  network: 'facebook',
  type: 'click',
  priority: 3,
  version: '0.1',
  patterns: [
    {
      node: '.PageLikeButton:contains("Unlike"), .PageLikeButton:contains("Gefällt mir nicht mehr")',
      container: '.PageLikeButton'
    }
  ]
},{
  name: 'unlike-comment',
  network: 'facebook',
  type: 'click',
  priority: 4,
  version: '0.2',
  patterns: [
    {
      node: '.UFICommentActions .UFILikeLink:contains("Like"), .UFICommentActions .UFILikeLink:contains("Gefällt mir")',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},{
  name: 'unlike-content',
  network: 'facebook',
  type: 'click',
  priority: 5,
  version: '0.2',
  patterns: [
    {
      node: '.UFILikeLink span:contains("Like"), .UFILikeLink span:contains("Gefällt mir")',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},{
  name: 'unlike-photo',
  network: 'facebook',
  type: 'click',
  priority: 2,
  version: '0.2',
  patterns: [
    {
      node: '.fbPhotosPhotoLike span.unlike',
      container: '.fbPhotoSnowliftPopup'
    },{
      node: '.UFILikeLink span:contains("Like"), .UFILikeLink span:contains("Gefällt mir")',
      container: '#fbPhotoPageContainer'
    },{
      node: '.UFILikeLink span:contains("Like"), .UFILikeLink span:contains("Gefällt mir")',
      container: '.fbPhotoSnowliftPopup'
    }
  ]
},{
  name: 'unlike-page',
  network: 'facebook',
  type: 'click',
  priority: 1,
  version: '0.1',
  patterns: [
    {
      node: '.PageLikeButton:contains("Like"), .PageLikeButton:contains("Gefällt mir"),.PageLikeButton:contains("Like") *, .PageLikeButton:contains("Gefällt mir") *',
      container: '.PageLikeButton'
    }
  ]
},{
  name: 'view-profile',
  network: 'facebook',
  type: 'click',
  priority: 5,
  version: '0.2',
  patterns: [
    {
      node: 'a.friendHovercard * , a[data-hovercard*="user"] *, a[href*="=ufi"] *, a.titlebarText, a[href*="=ufi"][data-hovercard], a[data-hovercard*="user"]',
      container: 'a',
      extractor: 'user-link'
    }
  ]
},
{
  name: 'comment-reply',
  network: 'facebook',
  type: 'input',
  priority: 6,
  version: '0.1',
  patterns: [
    {
      node: '.UFIReplyList *',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},
{
  name: 'comment-content',
  network: 'facebook',
  type: 'input',
  priority: 7,
  version: '0.1',
  patterns: [
    {
      node: '.UFIAddCommentInput *',
      container: '.userContentWrapper',
      extractor: 'status-update'
    }
  ]
},{
  name: 'comment-content',
  network: 'facebook',
  type: 'input',
  priority: 7,
  version: '0.1',
  patterns: [
    {
      node: '.UFIAddCommentInput *',
      container: '.userContentWrapper',
      extractor: 'status-update'
    },
    {
      node: '.UFIAddCommentInput *',
      container: '.fbPhotoSnowliftContainer'
    },
    {
      node: '.UFIAddCommentInput *',
      container: '.fbxPhotoContentContainer'
    }
  ]
},{
  name: 'friend-request-add',
  network: 'facebook',
  type: 'click',
  priority: 9,
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
  name: 'unfriend',
  network: 'facebook',
  type: 'click',
  priority: 10,
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
  name: 'friend-request-confirm',
  network: 'facebook',
  type: 'click',
  priority: 11,
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
  name: 'friend-request-reject',
  network: 'facebook',
  type: 'click',
  priority: 12,
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

var extractors = [
{
  name: 'status-update',
  fields: [{
    name: 'sharerId',
    selector: '> div > a',
    attr: 'href',
    match: '.+profile\\.php\\?id=\\d+(?=\\&)|.+(?=\\?)|.+',
    hash: true
  }, {
    name: 'contentId',
    selector: '> div.clearfix > div > div > div > div > div > span > span > a:first-child',
    match: '.+(?=\\?)|.+',
    attr: 'href',
    hash: true
  }]
},
{
  name: 'user-link',
  fields: [
  {
    name: 'userId',
    attr: 'href',
    match: '.+profile\\.php\\?id=\\d+(?=\\&)|.+(?=\\?)|.+',
    hash: true
  }]
},
{
  name: 'privacy-settings',
  network: 'facebook',
  type: 'url',
  informationUrl: 'https://www.facebook.com/settings/?tab=privacy',
  interval: 5000,
  container: '.fbSettingsSections',
  fields: [
  {
    name: 'viewFuturePosts',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(1) .fbSettingsListItem:nth-child(1) .fbSettingsListItemContent > div:last-child'
  },
  {
    name: 'sendFriendRequests',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(2) .fbSettingsListItem:nth-child(1) .fbSettingsListItemContent > div:last-child'
  },
  {
    name: 'MessageFilter',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(2) .fbSettingsListItem:nth-child(2) .fbSettingsListItemContent > div:last-child'
  },
  {
    name: 'EMailLookup',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(3) .fbSettingsListItem:nth-child(1) .fbSettingsListItemContent > div:last-child'
  },
  {
    name: 'PhonenumberLookup',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(3) .fbSettingsListItem:nth-child(2) .fbSettingsListItemContent > div:last-child'
  },
  {
    name: 'SearchEngines',
    attr: 'content',
    selector: '.fbSettingsSectionsItem:nth-child(3) .fbSettingsListItem:nth-child(3) .fbSettingsListItemContent > div:last-child'
  }]

}];

/* Background Script */
(function() {


  //*******************************//
  // Careful deletes all Rose data //
  //*******************************//
  // localforage.clear();

  //Write test observe into storage
  //FIX: Updater loads observers
  var observerCol = new ObserverCollection();
  observerCol.fetch({ success: function() {
    log('CoreBGScript', 'Observers loaded from storage');
    if (observerCol.length === 0) {
      for (var i = 0; i < observers.length; i++) {
        observerCol.create(observers[i]);
      }
    }

  }});

  /*
   * Extractor Engine
   * ----------------
   *
   * Store Extracotrs in storage and start extractor engine and integrate
   * with execution service.
   */
  var extractorCol = new ExtractorCollection();
  var extractorEngine;
  extractorCol.fetch({success: function extractorCollSuccesfullyLoaded(){
    log('CoreBGScript', 'Extractors loaded from storage');
    if (extractorCol.length === 0) {
      for (var j = 0; j < extractors.length; j++) {
        extractorCol.create(extractors[j]);
      }
    }
    extractorEngine = new ExtractorEngine(extractorCol);
    extractorEngine.register();
  }});

  WindowTracker.start();
})();

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(event) {
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
});
