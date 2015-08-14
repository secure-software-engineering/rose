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
let checkInterval = 5000;
let idleInterval = 120000;
let surveyInterval = 3600000;
let _windowActivities;
let _pageActivities;
let _engageActivities;
let lastEngage,lastDisengage,_currentTime,_surveyTime;
let running = false;

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
  _pageActivities = scrollActivities;
  kango.invokeAsyncCallback('localforage.getItem', 'mousemove-activity-records', getClickActivity);
};

let getClickActivity = (mousemoveActivities) => {
  _pageActivities = _.union(_pageActivities, mousemoveActivities);
  kango.invokeAsyncCallback('localforage.getItem', 'click-activity-records', checkConditions);
};

let checkConditions = (clickActivities) => {
  _pageActivities = _.union(_pageActivities, clickActivities);
  let checkTime = _currentTime - checkInterval;
  let idleTime = _currentTime - idleInterval;

  /**
   * group activity by
   * - their activity status
   * - the date intervals: now, recent(ideltime), old (suvreytime), too_old (not relevant)
   */
  let groupByDate = (activity) => {
    if (activity.date > checkTime) {
      return 'now';
    }
    else if (activity.date > idleTime) {
      return 'recent';
    }
    else if (activity.date > _surveyTime) {
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

  tmpActivity = _.find(_windowActivities, activityInIntervall(idleTime, _surveyTime, 'active'));
  let oldActiveTabs    = (tmpActivity !== undefined && tmpActivity.value.active);

  //openTabs
  let open           = _windowActivities[0].value.open;

  tmpActivity = _.find(_windowActivities, activityInIntervall(checkTime, idleTime, 'open'));
  let recentOpenTabs = (tmpActivity !== undefined && tmpActivity.value.open);

  tmpActivity = _.find(_windowActivities, activityInIntervall(idleTime, _surveyTime, 'open'));
  let oldOpenTabs = (tmpActivity !== undefined && tmpActivity.value.open);

  let anyOpenTabs    = recentOpenTabs || oldOpenTabs;

  //page activity
  let recentPageActivity = (_pageActivities.recent !== undefined);

  let oldPageActivity    = (_pageActivities.old !== undefined);

  //debug
  let logData = {lastEngage, lastDisengage, open, active, recentActiveTabs, oldActiveTabs, recentPageActivity, oldPageActivity, anyOpenTabs};

  /*
   * CHECK CONDITIONS
   */
  let engage;
  if (active && (!recentActiveTabs || !recentPageActivity))  {
    console.log('engaging: a tab is active after no recent activity');
    console.log(logData);
    engage = true;
  }
  else if (open && !anyOpenTabs) {
    console.log('engaging: a tab is opened after no tab was open');
    console.log(logData);
    engage = true;
  }
  else if (!open && (recentPageActivity || recentActiveTabs)) {
    console.log('disengaging: last tab is closed after recent activity');
    console.log(logData);
    engage = false;
  }
  else if (open && !active && !recentActiveTabs && oldActiveTabs) {
    console.log('disengaging: no recent active tabs any more');
    console.log(logData);
    engage = false;
  }
  else if (active && !recentPageActivity && oldPageActivity) {
    console.log('disengaging: active tab, but no recent page activity');
    console.log(logData);
    engage = false;
  }
  else {
    console.log(logData);
    running = false;
    return;
  }

  //store when last dis-/engage has passed longer than survey interval
  if ((!engage && (lastDisengage === undefined || lastDisengage < _surveyTime)) || (engage && (lastEngage === undefined || lastEngage < _surveyTime))) {
    //store and trigger
    store(engage);
    console.log('and stored');
    kango.browser.tabs.getCurrent(function(tab) {
      tab.dispatchMessage('TriggerSurvey',engage);
    });
  }
  else {
    running = false;
  }
};

let start = function() {
  setInterval(check, checkInterval);
};

export default {
  start
};
