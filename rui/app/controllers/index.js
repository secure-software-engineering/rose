import Ember from 'ember'

export default Ember.Controller.extend({
  clickChartOptions: {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Mouse Clicks'
    },
    xAxis: {
      ordinal: false
    },
    yAxis: {
      title: {
        text: 'Number of Clicks'
      },
      allowDecimals: false
    }
  },

  clickChartData: Ember.computed('model', function () {
    const model = this.get('model')
    const data = model[0]

    if (data) {
      return [{
        data: data.map((record) => {
          return [record.date, record.value]
        })
      }]
    }
  }),

  mouseMoveChartOptions: {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Mouse Movement'
    },
    xAxis: {
      ordinal: false
    },
    yAxis: {
      title: {
        text: 'Distance in Pixels'
      },
      allowDecimals: false
    }
  },

  mouseMoveChartData: Ember.computed('model', function () {
    const model = this.get('model')
    const data = model[1]

    if (data) {
      return [{
        data: data.map((record) => {
          return [record.date, record.value]
        })
      }]
    }
  }),

  scrollChartOptions: {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Page Scroll'
    },
    xAxis: {
      ordinal: false
    },
    yAxis: {
      title: {
        text: 'Distance in Pixels'
      },
      allowDecimals: false
    }
  },

  scrollChartData: Ember.computed('model', function () {
    const model = this.get('model')
    const data = model[2]

    if (data) {
      return [{
        data: data.map((record) => {
          return [record.date, record.value]
        })
      }]
    }
  }),

  windowChartOptions: {
    chart: {
      type: 'line',
      zoomType: 'x'
    },
    title: {
      text: 'Window Activity'
    },
    xAxis: {
      ordinal: false
    },
    yAxis: {
      title: {
        text: 'Window Status'
      },
      allowDecimals: false
    },
    navigator: {
      series: {
        type: 'column'
      }
    }
  },

  windowChartData: Ember.computed('model', function () {
    const model = this.get('model')
    const data = model[3]

    if (data) {
      return [{
        step: true,
        data: data.map((record) => {
          const status = (function (value) {
            if (value.open && value.active)
              return 2
            else if (value.open && !value.active)
              return 1
            else if (!value.open && !value.active)
              return 0
            else
              throw new Error('window activity tracker data is corrupt')
          })(record.value)
          return [record.date, status]
        })
      }]
    }
  }),

  loginChartOptions: {
    chart: {
      type: 'line',
      zoomType: 'x'
    },
    title: {
      text: 'Login Status'
    },
    xAxis: {
      ordinal: false
    },
    yAxis: {
      title: {
        text: 'Distance in Pixels'
      },
      allowDecimals: false
    },
    navigator: {
      series: {
        type: 'column'
      }
    }
  },

  loginChartData: Ember.computed('model', function () {
    const model = this.get('model')
    const data = model[4]

    if (data) {
      return [{
        step: true,
        data: data.map((record) => {
          let status = (function (value) {
            if (!value)
              return 0
            else
              return 1
          })(record.value)
          return [record.date, status]
        })
      }]
    }
  })
})
