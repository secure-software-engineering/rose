/*
Copyright (C) 2015
    Oliver Hoffmann <oliverh855@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */
let type = 'engage';
let network = 'facebook.com';
let checkInterval = 5000;
let idleInterval = 180000;
let surveyInterval = 600000;
let _windowActivities, _pageActivities, _engageActivities, _loginActivities;
let lastEngage,lastDisengage,_currentTime,_surveyTime;
let running = false;

let token, control, limit;

let store = function(engage) {
      _engageActivities = _engageActivities || [];
      _engageActivities.push({
        type: type,
        date: Date.now(),
        value: engage
      });

      kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', _engageActivities, () => {
        running = false;
      });
};

let check = () => {
  if (running) return;
  running = true;
  kango.invokeAsyncCallback('localforage.getItem', 'window-activity-records', checkAnyTabPresent);
};

let checkAnyTabPresent = (windowActivities) => {
  if (windowActivities === null) {
    console.log('No Tabs opened ever');
    running = false;
    return;
  }
  _windowActivities = windowActivities;

  //check if any tab in the history since surveyinterval is present otherwise quit
  _currentTime = Date.now();
  _surveyTime = _currentTime - surveyInterval;
  _windowActivities = _.sortBy(_windowActivities, 'date').reverse();
  if (_windowActivities[0].date > _surveyTime) {
    kango.invokeAsyncCallback('localforage.getItem', 'engage-activity-records', checkSurveyInterval);
  }
  else {
    console.log('No Tabs open in the survey cycle');
    running = false;
  }
};

let checkSurveyInterval = (engageActivities) => {
  _engageActivities = engageActivities;

  // get time last surveys were triggered
  let groupedEngageActivities = _.groupBy(_engageActivities, 'value');
  if (groupedEngageActivities.true !== undefined) {
    lastEngage = _.sortBy(groupedEngageActivities.true, 'date').pop().date;
  }
  else lastEngage = undefined;
  if (groupedEngageActivities.false !== undefined) {
    lastDisengage = _.sortBy(groupedEngageActivities.false, 'date').pop().date;
  }
  else lastDisengage = undefined;

  //do not procede if both surveys were triggered in the range of the surveyintervall
  if (lastEngage === undefined || lastDisengage === undefined || lastEngage < _surveyTime || lastDisengage < _surveyTime) {
    kango.invokeAsyncCallback('localforage.getItem', 'scroll-activity-records', getMousemoveActivity);
  }
  else {
    running = false;
    console.log('both surveys done');
  }

};

let getMousemoveActivity = (scrollActivities) => {
  _pageActivities = scrollActivities || [];
  kango.invokeAsyncCallback('localforage.getItem', 'mousemove-activity-records', getClickActivity);
};

let getClickActivity = (mousemoveActivities) => {
  _pageActivities = _.union(_pageActivities, mousemoveActivities || []);
  kango.invokeAsyncCallback('localforage.getItem', 'click-activity-records', getLoginActivity);
};

let getLoginActivity = (clickActivities) => {
  _pageActivities = _.union(_pageActivities, clickActivities || []);
  kango.invokeAsyncCallback('localforage.getItem', 'fb-login-activity-records', checkConditions);
};

let checkConditions = (loginActivities) => {
  _loginActivities = loginActivities || [];

  if (_loginActivities !== []) {
     _loginActivities = _.sortBy(_loginActivities, 'date').reverse();
  }
  let checkTime = _currentTime - checkInterval;
  let idleTime = _currentTime - idleInterval;
  let beforIdleTime = _currentTime - idleInterval * 2;

  /**
   * group activity by
   * - their activity status
   * - the date intervals: now, recent(idleTime), old (suvreytime), too_old (not relevant)
   */
  let groupByDate = (activity) => {
    if (activity.date > checkTime) {
      return 'now';
    }
    else if (activity.date > idleTime) {
      return 'recent';
    }
    else if (activity.date > beforIdleTime) {
      return 'old';
    }
    else {
      return 'too_old';
    }
  };
  _pageActivities = _.groupBy(_pageActivities, (activity) => {
    //check page activity for a ceratin threshold (currently obsolete, because there is now records with 0)
    if (activity.value > 0) {
      return groupByDate(activity);
    }
    else {
      return 'not_enough';
    }
  });
  // _windowActivities = _.groupBy(_windowActivities,(activity) => {
  //   let interval = groupByDate(activity);
  //   if (activity.value.active) {
  //     return interval + 'ActiveTabs';
  //   }
  //   else if (activity.value.open){
  //     return interval + 'OpenTabs';
  //   }
  //   else {
  //     return interval + 'NoTabs';
  //   }
  // });

  let tmpActivity;
  let activityInIntervall = (start, end, key) => {
    return (activity) => {
        if (activity.date > start) {
          return false;
        }
        else if (activity.date < end) {
          return true;
        }
        else if (activity.value[key]) {
          return true;
        }
        else {
          return false;
        }
      };
  };

  //create conditions from activities

  //active Tabs
  let active           = _windowActivities[0].value.active;

  tmpActivity = _.find(_windowActivities, activityInIntervall(checkTime, idleTime, 'active'));
  let recentActiveTabs = (tmpActivity !== undefined && tmpActivity.value.active);

  tmpActivity = _.find(_windowActivities, activityInIntervall(idleTime, beforIdleTime, 'active'));
  let oldActiveTabs    = (tmpActivity !== undefined && tmpActivity.value.active);

  //openTabs
  let open           = _windowActivities[0].value.open;

  tmpActivity = _.find(_windowActivities, activityInIntervall(checkTime, idleTime, 'open'));
  let recentOpenTabs = (tmpActivity !== undefined && tmpActivity.value.open);

  tmpActivity = _.find(_windowActivities, activityInIntervall(idleTime, beforIdleTime, 'open'));
  let oldOpenTabs = (tmpActivity !== undefined && tmpActivity.value.open);

  let anyOpenTabs    = recentOpenTabs || oldOpenTabs;

  //page activity
  let recentPageActivity = (_pageActivities.recent !== undefined);

  let oldPageActivity    = (_pageActivities.old !== undefined);

  //login status
  let logout = false;
  if (_loginActivities.length > 1) {
    if (_loginActivities[0].value === false && _loginActivities[1].value !== false && _loginActivities[0].date > idleTime) {
      logout = true;
    }
  }

  //debug
  let logData = {lastEngage, lastDisengage, open, active, recentActiveTabs, oldActiveTabs, recentPageActivity, oldPageActivity, anyOpenTabs, logout};
  console.log(logData);
  /*
   * CHECK CONDITIONS
   */
  let engage;
  if (active && (!recentActiveTabs || !recentPageActivity))  {
    console.log('engaging: a tab is active after no recent activity');
    engage = true;
  }
  else if (open && !anyOpenTabs) {
    console.log('engaging: a tab is opened after no tab was open');
    engage = true;
  }
  else if (logout === true) {
    console.log('disengaging: user performed logout');
    engage = false;
  }
  else if (!open && (recentPageActivity || recentActiveTabs)) {
    console.log('disengaging: last tab is closed after recent activity');
    engage = false;
  }
  else if (open && !active && !recentActiveTabs && oldActiveTabs) {
    console.log('disengaging: no recent active tabs any more');
    engage = false;
  }
  else if (active && !recentPageActivity && oldPageActivity) {
    console.log('disengaging: active tab, but no recent page activity');
    engage = false;
  }
  else {
    running = false;
    return;
  }

  //store when last dis-/engage has passed longer than survey interval
  if ((!engage && (lastDisengage === undefined || lastDisengage < _surveyTime)) || (engage && (lastEngage === undefined || lastEngage < _surveyTime))) {
    //store and trigger
    token = Date.now();
    limit = 0;
    sendTrigger(engage);
  }
  else {
    running = false;
  }
};

let sendTrigger = (engage) => {
    if (token === control) {
      console.log((!engage ? 'Dise' : 'E') + 'ngage survey triggered and stored');
      store(engage);
    }
    else {
      if (limit < 5) {
        console.log('Try to reach content script. Attempt: ' + (limit++));

        kango.browser.tabs.getCurrent(function(tab) {
          if (!engage || (new RegExp('^https:\/\/[\w\.\-]*(' + network.replace(/\./g, '\\$&') + ')(\/|$)')).test(tab.getUrl())) {
            if (limit % 3 === 0 ) {
              tab.navigate(tab.getUrl());
            }
            else {
              tab.dispatchMessage('TriggerSurvey', {engage, token});
            }
          }
        });
        setTimeout(sendTrigger, 1000 + limit*1000, engage);
      }
      else {
        console.log('Failed to reach content script.');
        running = false;
      }
    }
};

let start = function() {
  setInterval(check, checkInterval);
  kango.addMessageListener('TriggerSurveyReceived', (event) => {
    control = event.data;
  });
};

export default {
  start
};
