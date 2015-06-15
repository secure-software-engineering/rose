import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['highcharts-wrapper'],

  _renderChart: function() {
    this.drawLater();
  }.on('didInsertElement'),

  drawLater: function() {
    Ember.run.scheduleOnce('afterRender', this, 'draw');
  },

  draw: function() {
    this.$().highcharts('StockChart', {
      chart: {
        height: 800,
        zoomType: 'x'
      },

      title: {
        text: 'Activity Records'
      },

      navigator: {
        series: {
          type: 'column',
          // data: mouseVals,
          step: true
        },
        yAxis: {
          type: 'logarithmic',
        }
      },

      rangeSelector: {
        enabled: true,
        buttons: [{
          type: 'day',
          count: 1,
          text: 'Day'
        }, {
          type: 'week',
          count: 1,
          text: 'Week'
        }, {
          type: 'month',
          count: 1,
          text: 'Month'
        }, {
          type: 'all',
          text: 'All'
        }],
        buttonTheme: {
          width: 50
        }
      },

      tooltip: {
        pointFormat: 'Date: <b>{point.x:%B %e, %Y %H:%M}</b><br>Value: <b>{point.y}</b>'
      },

      // xAxis: {
      //   ordinal: false,
      //   min: dayBeforeFirst(mouseRecords),
      //   max: dayAfterLast(mouseRecords)
      // },

      yAxis: [{
        min: 0,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Move'
        },
        height: '30%',
        offset: 0,
        lineWidth: 2
      }, {
        min: 0,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Click'
        },
        top: '33%',
        height: '30%',
        offset: 0,
        lineWidth: 2
      }, {
        min: 0,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Scroll'
        },
        top: '66%',
        height: '30%',
        offset: 0,
        lineWidth: 2
      }],

      // series: [{
      //   type: 'scatter',
      //   name: 'Move',
      //   data: mouseVals,
      //   yAxis: 0
      // }, {
      //   type: 'scatter',
      //   name: 'Click',
      //   data: clickVals,
      //   yAxis: 1
      // }, {
      //   type: 'scatter',
      //   name: 'Scroll',
      //   data: scrollVals,
      //   yAxis: 2
      // }],

      plotOptions: {
        series: {
          pointWidth: 5
        }
      }
    });
  }
});
