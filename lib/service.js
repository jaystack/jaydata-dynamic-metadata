"use strict";
var extend = require('extend');
var metadataHandler_1 = require('./metadataHandler');
var jaydata_error_handler_1 = require('jaydata-error-handler');
var jaydata_promise_handler_1 = require('jaydata-promise-handler');
var ServiceParams = (function () {
    function ServiceParams() {
        this.config = {};
    }
    return ServiceParams;
})();
exports.ServiceParams = ServiceParams;
var DynamicMetadata = (function () {
    function DynamicMetadata($data) {
        this.$data = $data;
    }
    DynamicMetadata.prototype.service = function (serviceUri, config, callback) {
        var params = new ServiceParams();
        DynamicMetadata.getParam(config, params);
        DynamicMetadata.getParam(callback, params);
        if (typeof serviceUri == 'object') {
            extend(params.config, serviceUri);
        }
        else if (typeof serviceUri == 'string') {
            params.config = params.config || {};
            params.config.url = serviceUri;
        }
        var pHandler = new jaydata_promise_handler_1.PromiseHandler();
        var _callback = pHandler.createCallback(params.callback);
        var self = this;
        new metadataHandler_1.MetadataHandler(this.$data, params.config).load().then(function (factory) {
            var type = factory.type;
            var storeAlias = params.config.serviceName || params.config.storeAlias;
            if (storeAlias && 'addStore' in self.$data) {
                self.$data.addStore(storeAlias, factory, params.config.isDefault === undefined || params.config.isDefault);
            }
            _callback.success(factory, type);
        }, function (err) {
            _callback.error(err);
        });
        return pHandler.getPromise();
    };
    DynamicMetadata.prototype.initService = function (serviceUri, config, callback) {
        var params = new ServiceParams();
        DynamicMetadata.getParam(config, params);
        DynamicMetadata.getParam(callback, params);
        if (typeof serviceUri == 'object') {
            extend(params.config, serviceUri);
        }
        else if (typeof serviceUri == 'string') {
            params.config = params.config || {};
            params.config.url = serviceUri;
        }
        var pHandler = new jaydata_promise_handler_1.PromiseHandler();
        var _callback = pHandler.createCallback(params.callback);
        this.service(params.config.url, params.config, {
            success: function (factory) {
                var ctx = factory();
                if (ctx) {
                    return ctx.onReady(_callback);
                }
                return _callback.error(new jaydata_error_handler_1.Exception("Missing Context Type"));
            },
            error: _callback.error
        });
        return pHandler.getPromise();
    };
    DynamicMetadata.use = function ($data) {
        var dynamicMetadata = new DynamicMetadata($data);
        $data.service = dynamicMetadata.service;
        $data.initService = dynamicMetadata.initService;
    };
    DynamicMetadata.getParam = function (paramValue, params) {
        switch (typeof paramValue) {
            case 'object':
                if (typeof paramValue.success === 'function' || typeof paramValue.error === 'function') {
                    params.callback = paramValue;
                }
                else {
                    params.config = paramValue;
                }
                break;
            case 'function':
                params.callback = paramValue;
                break;
            default:
                break;
        }
    };
    return DynamicMetadata;
})();
exports.DynamicMetadata = DynamicMetadata;
//# sourceMappingURL=service.js.map