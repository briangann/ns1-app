"use strict";

System.register(["lodash"], function (_export, _context) {
  "use strict";

  var _, _createClass, SnapTaskAddCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("SnapTaskAddCtrl", SnapTaskAddCtrl = function () {
        function SnapTaskAddCtrl($scope, $injector, $q, $location, backendSrv, alertSrv) {
          _classCallCheck(this, SnapTaskAddCtrl);

          this.$q = $q;
          this.$location = $location;
          this.backendSrv = backendSrv;
          this.alertSrv = alertSrv;
          this.$scope = $scope;
          this.pageReady = true;
          this.creatingTasks = false;
          this.error = null;
          this.zones = [];
          this.monitoringJobs = [];
          this.taskType = "";
          this.newTask = {};
          this.queuedTask = [];
          this.ns1Token = null;
          this.getConfig();
          this.getZones();
          this.getMonitoringJobs();
        }

        _createClass(SnapTaskAddCtrl, [{
          key: "cancel",
          value: function cancel() {
            this.queuedTask = [];
            this.newTak = {};
            this.taskType = "";
          }
        }, {
          key: "getConfig",
          value: function getConfig() {
            var self = this;
            this.backendSrv.get("api/plugins/ns1-app/settings").then(function (resp) {
              self.ns1Token = resp.jsonData.ns1Token;
              if (self.ns1Token) {
                self.pageReady = true;
              } else {
                self.error = "NS1 Api Key not configured.";
              }
            });
          }
        }, {
          key: "addTask",
          value: function addTask() {
            if (this.taskType == "zone") {
              this.queuedTask.push({
                type: "zone",
                zone: this.newTask.zone
              });
            }
            if (this.taskType == "monitor") {
              this.queuedTask.push({
                type: "monitoring",
                jobId: this.newTask.job.id,
                name: this.newTask.job.name
              });
            }
            this.newTask = {};
          }
        }, {
          key: "getZones",
          value: function getZones() {
            var self = this;
            return this.backendSrv.get('api/plugin-proxy/ns1-app/ns1/zones').then(function (resp) {
              self.zones = resp;
            });
          }
        }, {
          key: "getMonitoringJobs",
          value: function getMonitoringJobs() {
            var self = this;
            return this.backendSrv.get('api/plugin-proxy/ns1-app/ns1/monitoring/jobs').then(function (resp) {
              self.monitoringJobs = resp;
            });
          }
        }, {
          key: "create",
          value: function create() {
            var self = this;
            this.creatingTasks = true;
            var promises = [];
            _.forEach(this.queuedTask, function (task) {
              if (task.type === "zone") {
                promises.push(self.addZoneTask(task.zone));
              }
              if (task.type === "monitoring") {
                promises.push(self.addMonitorTask(task.jobId, task.name));
              }
            });

            this.$q.all(promises).then(function () {
              console.log("finished creating tasks.");
              self.queuedTask = [];
              self.creatingTasks = false;
              self.$location.path("plugins/ns1-app/page/list-tasks");
            }, function (resp) {
              console.log("failed to add all tasks.", resp);
              self.creatingTasks = false;
              self.alertSrv.set("failed to create task", resp, 'error', 10000);
            });
          }
        }, {
          key: "addZoneTask",
          value: function addZoneTask(zone) {
            var _this = this;

            var task = {
              "name": "ns1-zone-" + zone,
              "metrics": { "/raintank/apps/ns1/zones/*": 0 },
              "config": {
                "/raintank/apps/ns1": {
                  "ns1_key": this.ns1Token,
                  "zone": zone
                }
              },
              "interval": 300,
              "route": { "type": "any" },
              "enabled": true
            };

            return this.backendSrv.post("api/plugin-proxy/ns1-app/tasks", task).then(function (resp) {
              if (resp.meta.code !== 200) {
                console.log("request failed.", resp.meta.message);
                return _this.$q.reject(resp.meta.message);
              }
            });
          }
        }, {
          key: "addMonitorTask",
          value: function addMonitorTask(jobId, jobName) {
            var _this2 = this;

            var taskName = "ns1-monitoring-" + jobId;
            var task = {
              "name": "ns1-monitoring-" + jobId,
              "metrics": { "/raintank/apps/ns1/monitoring/*": 0 },
              "config": {
                "/raintank/apps/ns1": {
                  "ns1_key": this.ns1Token,
                  "jobId": jobId,
                  "jobName": jobName
                }
              },
              "interval": 300,
              "route": { "type": "any" },
              "enabled": true
            };

            return this.backendSrv.post("api/plugin-proxy/ns1-app/tasks", task).then(function (resp) {
              if (resp.meta.code !== 200) {
                console.log("request failed.", resp.meta.message);
                return _this2.$q.reject(resp.meta.message);
              }
            });
          }
        }]);

        return SnapTaskAddCtrl;
      }());

      SnapTaskAddCtrl.templateUrl = 'public/plugins/ns1-app/components/snaptask/partials/snaptask_add.html';

      _export("SnapTaskAddCtrl", SnapTaskAddCtrl);
    }
  };
});
//# sourceMappingURL=snaptask_add.js.map
