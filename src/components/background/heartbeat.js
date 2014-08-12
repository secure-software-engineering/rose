var log = require('./../log');

/**
* @module Core
* @submodule Heartbeat
*/
var Heartbeat = (function() {
    var Heartbeat = {
        intervals: {
            /**
            * Interval in which the heartbeat should check and execute tasks.
            * In milliseconds.
            *
            * @property interval.beat
            * @type Number
            * @default 5000
            */
            beat: 5000,
            /**
            * Interval in which changes to the listed tasks should be
            * written to storage.
            * In milliseconds.
            *
            * @property interval.storage
            * @type Number
            * @default 60000
            */
            storage: 60000
        }
    };

    var tasks = {},
        time = 0;

    /**
    * Loads existing information on tasks from storage and starts
    * the heartbeat.
    *
    * @method start
    */
    Heartbeat.start = function start() {
        log('Heartbeat', 'Load configuration from storage and set up heartbeat');

        // Load tasks from storage
        kango.invokeAsync('kango.storage.getItem', 'heartbeat', function(data) {
            // Load tasks
            tasks = data.tasks || {};

            // Schedule store task
            Heartbeat.schedule('store', Heartbeat.intervals.storage, {}, function() {
                // Save changes to storage
                Heartbeat.store();
            });

            // Start heartbeat
            Heartbeat.beat();
        });
    };

    /**
    * Saves information on tasks to storage.
    *
    * @method store
    */
    Heartbeat.store = function store() {
        log('Heartbeat', 'Store configuration in storage');

        // Prepare tasks for storage
        var _tasks = {};
        for (var name in tasks) {
            _tasks[name] = {};

            _tasks[name].interval = tasks[name].interval;
            _tasks[name].last = tasks[name].last;
            _tasks[name].data = tasks[name].data;
        }

        // Save tasks to storage
        kango.invokeAsync('kango.storage.setItem', 'heartbeat', {
            'tasks': _tasks
        });
    };

    /**
    * Schedules a task to be executed in a certain interval.
    *
    * @method schedule
    * @param {String} name Name of the task
    * @param {Number} interval Interval in which the task should be executed
    * @param {Object} data Data to be passed to the task function
    * @param {Function} task Function performing the task.
    */
    Heartbeat.schedule = function schedule(name, interval, data, task) {
        log('Heartbeat', 'Schedule new task: ' + name);

        if (tasks[name] === undefined) {
            // Add new task
            tasks[name] = {
                'interval': interval,
                'last': 0,
                'data': data,
                'task': task
            };

            log('Heartbeat', 'Task added: ' + name);
        } else {
            // Update existing task's interval...
            tasks[name].interval = interval;

            // ... data...
            tasks[name].data = data;

            // ... and task
            tasks[name].task = task;

            log('Heartbeat', 'Task updated: ' + name);
        }
    };

    /**
    * Triggers execution of tasks and updates timestamp.
    *
    * @method beat
    */
    Heartbeat.beat = function beat() {
        // Evaluate and execute tasks
        Heartbeat.execute();

        // Update timestamp
        time = (new Date()).getTime();

        // Schedule next beat
        setTimeout(Heartbeat.beat, Heartbeat.intervals.beat);
    };

    /**
    * Checks all tasks and executes those that are due.
    *
    * @method execute
    */
    Heartbeat.execute = function execute() {
        // Keeps track of all executed tasks
        var fired = [];

        // Current timestamp
        var now = (new Date()).getTime();

        // Check all tasks
        for (var name in tasks) {
            var context = tasks[name];

            if (now - context.last > context.interval) {
                // Set timestamp of last execution to now
                context.last = now;

                // Execute task
                context.task(context.data);

                // Save name for logging
                fired.push(name);
            }
        }

        if (fired.length > 0) {
            log('Heartbeat', 'Tasks executed: ' + fired.join(', '));
        }
    };

    return Heartbeat;
})();

module.exports = Heartbeat;
