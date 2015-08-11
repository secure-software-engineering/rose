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
let idletime = 300;
let surveyRepeatTime = 3600;
let checkTime = 2;
let _windowActivities;
let _scrollActivities;
let _mousemoveActivities;
let _clickActivities;

let check = () => {
  //Trigger for engaging Facebook and starting survey #1
  kango.invokeAsyncCallback('localforage.getItem', 'window-activity-records', getScrollActivity);
};

let getScrollActivity = (windowActivities) => {
  _windowActivities = windowActivities;
  kango.invokeAsyncCallback('localforage.getItem', 'scroll-activity-records', getMousemoveActivity);
};

let getMousemoveActivity = (scrollActivities) => {
  _scrollActivities = scrollActivities;
  kango.invokeAsyncCallback('localforage.getItem', 'mousemove-activity-records', getClickActivity);
};

let getClickActivity = (mousemoveActivities) => {
  _mousemoveActivities = mousemoveActivities;
  kango.invokeAsyncCallback('localforage.getItem', 'click-activity-records', checkConditions);
};

let checkConditions = (clickActivities) => {
  _clickActivities = clickActivities;
  let currentTime = Date.now();


  //extract last entry from arrays
  _windowActivities = _.sortBy(_windowActivities, 'date');
  let currentWindowStatus = _windowActivities.pop();

  // _scrollActivities = _.sortBy(_scrollActivities, 'date');
  // let currentScrollStatus = _scrollActivities.pop();

  // _clickActivities = _.sortBy(_clickActivities, 'date');
  // let currentClickStatus = _clickActivities.pop();

  // _mousemoveActivities = _.sortBy(_mousemoveActivities, 'date');
  // let currentMousemoveStatus = _mousemoveActivities.pop();

  //union page activity
  let allPageActivities = _.union(_scrollActivities, _mousemoveActivities, _clickActivities);
  // let allPageActivities = _.union(priorPageActivities, [currentMousemoveStatus, currentClickStatus, currentScrollStatus]);

  //check condition: if there was an active tab before
  let priorActiveTabs = _.some(_windowActivities, function(activity) {
    let wasActive = activity.value.active;
    let inTime = activity.date >= currentTime - idletime*1000;
    return (wasActive && inTime);
  });

  let anyPageActivity = _.some(allPageActivities, (activity) => {
    let wasActive = (activity.value !== 0);
    let inTime = activity.date >= currentTime - idletime*1000;
    return (wasActive && inTime);
  });
  let priorPageActivity = _.some(allPageActivities, (activity) => {
    let wasActive = (activity.value !== 0);
    let inTime = (activity.date >= currentTime - idletime*1000 && activity.date < currentTime - checkTime*1000);
    return (wasActive && inTime);
  });

      console.log({currentWindowStatus.value.active, priorActiveTabs, priorPageActivity});

      console.log({currentWindowStatus.value.open, anyPageActivity});
  //check if is engaging
  if (currentWindowStatus.value.active === true && (!priorActiveTabs || !priorPageActivity) ) {

      //trigger condition 1
      console.log('condition 1:');
      console.log({currentWindowStatus, priorActiveTabs, priorPageActivity});

  }//check if disengaging
  else if (currentWindowStatus.value.open === false && anyPageActivity) {
      //trigger condition 2
      //
      console.log('condition 2:');
      console.log({currentWindowStatus, anyPageActivity});
  }

};

let start = function() {
  setInterval(check, 5000);
};

export default {
  start
};
