"use strict";
var odata_v4_metadata_1 = require("odata-v4-metadata");
var metadata_1 = require("./metadata");
var _odatajs = require("jaydata-odatajs");
var extend = require("extend");
exports.odatajs = _odatajs;
var MetadataHandler = (function () {
    function MetadataHandler($data, options) {
        this.$data = $data;
        this.options = options || {};
        this.prepareRequest = options.prepareRequest || function () { };
        if (typeof exports.odatajs === 'undefined' || typeof exports.odatajs.oData === 'undefined') {
            console.error('Not Found!:', 'odatajs is required');
        }
        else {
            this.oData = exports.odatajs.oData;
        }
    }
    MetadataHandler.prototype.parse = function (text) {
        var _this = this;
        var edmMetadata = new odata_v4_metadata_1.Edm.Edmx(this.oData.metadata.metadataParser(null, text));
        var metadata = new metadata_1.Metadata(this.$data, this.options, edmMetadata);
        var types = metadata.processMetadata();
        var contextType = types.filter(function (t) { return t.isAssignableTo(_this.$data.EntityContext); })[0];
        var factory = this._createFactoryFunc(contextType);
        factory.type = contextType;
        factory.src = types.src;
        factory.dts = types.dts;
        return factory;
    };
    MetadataHandler.prototype.load = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var serviceUrl = self.options.url.replace('/$metadata', '');
            var metadataUrl = serviceUrl.replace(/\/+$/, '') + '/$metadata';
            self.options.serviceUri = serviceUrl;
            var requestData = [
                {
                    requestUri: metadataUrl,
                    method: self.options.method || "GET",
                    headers: self.options.headers || {}
                },
                function (data) {
                    var edmMetadata = new odata_v4_metadata_1.Edm.Edmx(data);
                    var metadata = new metadata_1.Metadata(self.$data, self.options, edmMetadata);
                    var types = metadata.processMetadata();
                    var contextType = types.filter(function (t) { return t.isAssignableTo(self.$data.EntityContext); })[0];
                    var factory = self._createFactoryFunc(contextType);
                    factory.type = contextType;
                    factory.src = types.src;
                    factory.dts = types.dts;
                    resolve(factory);
                },
                reject,
                self.oData.metadataHandler
            ];
            self._appendBasicAuth(requestData[0], self.options.user, self.options.password, self.options.withCredentials);
            self.prepareRequest.call(self, requestData);
            self.oData.request.apply(self.oData, requestData);
        });
    };
    MetadataHandler.prototype._createFactoryFunc = function (ctxType) {
        var _this = this;
        return function (config) {
            if (ctxType) {
                var cfg = extend({
                    name: 'oData',
                    oDataServiceHost: _this.options.url.replace('/$metadata', ''),
                    user: _this.options.user,
                    password: _this.options.password,
                    withCredentials: _this.options.withCredentials,
                    maxDataServiceVersion: _this.options.maxDataServiceVersion || '4.0'
                }, config);
                return new ctxType(cfg);
            }
            else {
                return null;
            }
        };
    };
    MetadataHandler.prototype._appendBasicAuth = function (request, user, password, withCredentials) {
        request.headers = request.headers || {};
        if (!request.headers.Authorization && user && password) {
            request.headers.Authorization = "Basic " + this.__encodeBase64(user + ":" + password);
        }
        if (withCredentials) {
            request.withCredentials = withCredentials;
        }
    };
    MetadataHandler.prototype.__encodeBase64 = function (val) {
        var b64array = "ABCDEFGHIJKLMNOP" +
            "QRSTUVWXYZabcdef" +
            "ghijklmnopqrstuv" +
            "wxyz0123456789+/" +
            "=";
        var input = val;
        var base64 = "";
        var hex = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3)) {
                enc4 = 64;
            }
            base64 = base64 +
                b64array.charAt(enc1) +
                b64array.charAt(enc2) +
                b64array.charAt(enc3) +
                b64array.charAt(enc4);
        } while (i < input.length);
        return base64;
    };
    return MetadataHandler;
}());
exports.MetadataHandler = MetadataHandler;
//# sourceMappingURL=metadataHandler.js.map