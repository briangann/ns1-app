"use strict";

System.register(["./config.html!text"], function (_export, _context) {
  var configTemplate, _createClass, Ns1ConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_configHtmlText) {
      configTemplate = _configHtmlText.default;
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

      _export("ConfigCtrl", Ns1ConfigCtrl = function () {
        function Ns1ConfigCtrl($scope, $injector, backendSrv) {
          _classCallCheck(this, Ns1ConfigCtrl);

          this.backendSrv = backendSrv;
          this.appModel.secureJsonData = {};
          if (this.appModel.jsonData === null) {
            this.appModel.jsonData = {
              gnetTokenSet: false,
              ns1TokenSet: false
            };
          }
          this.taskStatus = "Task not found";
          this.task = {};
          this.error = false;
          this.appEditCtrl.setPreUpdateHook(this.preUpdate.bind(this));
          this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
          var self = this;
          if (this.appModel.enabled) {
            this.getCustomerId().then(function (resp) {
              var taskName = self.taskName(resp.customerid);
              self.getTask(taskName);
            });
          }
        }

        _createClass(Ns1ConfigCtrl, [{
          key: "preUpdate",
          value: function preUpdate() {
            if (this.appModel.secureJsonData.ns1_token) {
              this.appModel.jsonData.ns1TokenSet = true;
            }
            if (this.appModel.secureJsonData.gnet_token) {
              this.appModel.jsonData.gnetTokenSet = true;
            }
            return Promise.resolve();
          }
        }, {
          key: "postUpdate",
          value: function postUpdate() {
            var _this = this;

            var self = this;
            if (!this.appModel.enabled) {
              return Promise.resolve();
            }
            // make sure our Api key works.
            return this.getCustomerId().then(function (resp) {
              return self.ensureTask(resp.customerid).then(function () {
                return _this.appEditCtrl.importDashboards();
              });
            }, function () {
              console.log("failed to query NS1 API.");
              self.error = "Unable to query NS1 API. please re-enter API Key";
            });
          }
        }, {
          key: "getCustomerId",
          value: function getCustomerId() {
            return this.backendSrv.get("api/plugin-proxy/raintank-ns1-app/ns1/account/settings");
          }
        }, {
          key: "taskName",
          value: function taskName(customerid) {
            return "NS1-" + customerid;
          }
        }, {
          key: "ensureTask",
          value: function ensureTask(customerid) {
            var _this2 = this;

            var self = this;
            var taskName = this.taskName(customerid);
            return this.getTask(taskName).then(function (exists) {
              if (exists) {
                self.taskStatus = "Task not created";
                return;
              }
              var task = {
                "name": taskName,
                "metrics": { "/raintank/apps/ns1/_all": 0 },
                "config": {
                  "/raintank/apps/ns1": {
                    "ns1_key": self.appModel.secureJsonData.ns1_token
                  }
                },
                "interval": 60,
                "route": { "type": "any", "config": { id: 1 } },
                "enabled": true
              };

              return self.backendSrv.post("/api/plugin-proxy/raintank-ns1-app/tasks", task).then(function (resp) {
                _this2.task = resp.body;
                self.taskStatus = "Task running";
              });
            });
          }
        }, {
          key: "getTask",
          value: function getTask(taskName) {
            var self = this;
            return this.backendSrv.get("/api/plugin-proxy/raintank-ns1-app/tasks", { metric: "/raintank/apps/ns1/_all", name: taskName }).then(function (resp) {
              console.log(resp);
              if (resp.body.length > 0) {
                self.task = resp.body[0];
                self.taskStatus = "Task running";
                return true;
              }
              return false;
            });
          }
        }, {
          key: "stopTask",
          value: function stopTask() {
            var _this3 = this;

            if (!this.task) {
              console.log("unknown task name.");
              return;
            }
            return this.backendSrv.delete("/api/plugin-proxy/raintank-ns1-app/tasks/" + this.task.id).then(function (resp) {
              console.log(resp);
              _this3.task = {};
              _this3.taskStatus = "Task not found";
            });
          }
        }]);

        return Ns1ConfigCtrl;
      }());

      Ns1ConfigCtrl.template = configTemplate;

      _export("ConfigCtrl", Ns1ConfigCtrl);
    }
  };
});
//# sourceMappingURL=config.js.map
