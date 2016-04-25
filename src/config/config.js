import configTemplate from './config.html!text';

class Ns1ConfigCtrl {
  constructor($scope, $injector, backendSrv) {
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
      this.getCustomerId().then((resp) => {
        var taskName = self.taskName(resp.customerid);
        self.getTask(taskName);
      });
    }
  }

  preUpdate() {
    if (this.appModel.secureJsonData.ns1_token) {
      this.appModel.jsonData.ns1TokenSet =true;
    }
    if (this.appModel.secureJsonData.gnet_token) {
      this.appModel.jsonData.gnetTokenSet =true;
    }
    return this.initDatasource();
  }

  postUpdate() {
  	var self = this;
    if (!this.appModel.enabled) {
      return Promise.resolve();
    }
    // make sure our Api key works.
    return this.getCustomerId()
    .then((resp) => {
      return self.ensureTask(resp.customerid).then(() => {
        return this.appEditCtrl.importDashboards(); 
      });
    }, () => {
      console.log("failed to query NS1 API.");
    	self.error = "Unable to query NS1 API. please re-enter API Key";
    })
  }

  getCustomerId() {
    return this.backendSrv.get("api/plugin-proxy/raintank-ns1-app/ns1/account/settings");
  }

  taskName(customerid) {
    return "NS1-" + customerid;
  }

  ensureTask(customerid) {
    var self = this;
    var taskName = this.taskName(customerid);
    return this.getTask(taskName).then((exists) => {
      if (exists) {
        self.taskStatus = "Task not created";
        return;
      }
      var task = {
        "name": taskName,
        "metrics": {"/raintank/apps/ns1/*":0},
        "config": {
          "/raintank/apps/ns1": {
            "ns1_key": self.appModel.secureJsonData.ns1_token
          }
        },
        "interval": 60,
        "route": { "type": "any"},
        "enabled": true
      };

      return self.backendSrv.post("/api/plugin-proxy/raintank-ns1-app/tasks", task).then((resp) => {
        this.task = resp.body;
        self.taskStatus = "Task running";
      });
    });
  }

  getTask(taskName) {
    var self = this;
    return this.backendSrv.get("/api/plugin-proxy/raintank-ns1-app/tasks", {metric: "/raintank/apps/ns1/*", name: taskName}).then((resp) => {
      console.log(resp);
      if (resp.body.length > 0 ){
        self.task = resp.body[0];
        self.taskStatus = "Task running";
        return true;
      }
      return false;
    });
  }

  stopTask() {
    if (!this.task) {
      console.log("unknown task name.");
      return;
    }
    return this.backendSrv.delete("/api/plugin-proxy/raintank-ns1-app/tasks/"+this.task.id).then((resp) => {
      console.log(resp);
      this.task = {};
      this.taskStatus = "Task not found";
    });
  }

  initDatasource() {
    var self = this;
    //check for existing datasource.
    return self.backendSrv.get('/api/datasources').then(function(results) {
      var foundGraphite = false;
      var foundElastic = false;
      _.forEach(results, function(ds) {
        if (foundGraphite && foundElastic) { return; }
        if (ds.name === "raintank") {
          foundGraphite = true;
        }
        if (ds.name === "raintankEvents") {
          foundElastic = true;
        }
      });
      var promises = [];
      if (!foundGraphite) {
        // create datasource.
        var graphite = {
          name: 'raintank',
          type: 'graphite',
          url: 'api/plugin-proxy/raintank-ns1-app/graphite',
          access: 'direct',
          jsonData: {}
        };
        promises.push(self.backendSrv.post('/api/datasources', graphite));
      }
      if (!foundElastic) {
        // create datasource.
        var elastic = {
          name: 'raintankEvents',
          type: 'elasticsearch',
          url: 'api/plugin-proxy/raintank-ns1-app/elasticsearch',
          access: 'direct',
          database: '[events-]YYYY-MM-DD',
          jsonData: {
            esVersion: 1,
            interval: "Daily",
            timeField: "timestamp"
          }
        };
        promises.push(self.backendSrv.post('/api/datasources', elastic));
      }
      return Promise.all(promises);
    });
  }
}

Ns1ConfigCtrl.template = configTemplate;

export {
  Ns1ConfigCtrl as ConfigCtrl
};

