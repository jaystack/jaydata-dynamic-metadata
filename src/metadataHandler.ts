import { Edm } from 'odata-v4-metadata'
import { Metadata } from './metadata'
import * as _odatajs from 'jaydata-odatajs';
import * as extend from 'extend';

export var odatajs = _odatajs;

export class MetadataHandler{
	options:any
	prepareRequest:Function
	oData:any
	private $data:any
	constructor($data:any, options:any){
		this.$data = $data;
		this.options = options || {};
		this.prepareRequest = options.prepareRequest || function(){};

		if (typeof odatajs === 'undefined' || typeof odatajs.oData === 'undefined') {
            console.error('Not Found!:', 'odatajs is required');
        } else {
            this.oData = odatajs.oData
        }
	}
	parse(text:string):any {
		var edmMetadata = new Edm.Edmx(this.oData.metadata.metadataParser(null, text));
		var metadata = new Metadata(this.$data, this.options, edmMetadata);
		var types = metadata.processMetadata();

		var contextType = types.filter((t)=> t.isAssignableTo(this.$data.EntityContext))[0];

		var factory = this._createFactoryFunc(contextType);
		factory.type = contextType;
		factory.src = types.src;
        factory.dts = types.dts;

		return factory;
	}
	load():Promise<any>{
		var self = this;
		return new Promise<any>(function(resolve, reject){
			var serviceUrl:string = self.options.url.replace('/$metadata', '')
	        var metadataUrl:string = serviceUrl.replace(/\/+$/, '') + '/$metadata'
	        self.options.serviceUri = serviceUrl;

			var requestData = [
	            {
	                requestUri: metadataUrl,
	                method: self.options.method || "GET",
	                headers: self.options.headers || {}
	            },
	            (data) => {
	                var edmMetadata = new Edm.Edmx(data)
	                var metadata = new Metadata(self.$data, self.options, edmMetadata);
	                var types = metadata.processMetadata();

	                var contextType = types.filter((t)=> t.isAssignableTo(self.$data.EntityContext))[0];

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
	}
	private _createFactoryFunc(ctxType):any{
        return (config) => {
            if (ctxType) {
                var cfg = extend({
                    name: 'oData',
                    oDataServiceHost: this.options.url.replace('/$metadata', ''),
                    user: this.options.user,
                    password: this.options.password,
                    withCredentials: this.options.withCredentials,
                    maxDataServiceVersion: this.options.maxDataServiceVersion || '4.0'
                }, config)

                return new ctxType(cfg);
            } else {
                return null;
            }
        }
    }
	private _appendBasicAuth(request:any, user:string, password:string, withCredentials:boolean) {
        request.headers = request.headers || {};
        if (!request.headers.Authorization && user && password) {
            request.headers.Authorization = "Basic " + this.__encodeBase64(user + ":" + password);
        }
        if (withCredentials){
            request.withCredentials = withCredentials;
        }
    }
    private __encodeBase64(val:string):string {
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
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            base64 = base64 +
	            b64array.charAt(enc1) +
	            b64array.charAt(enc2) +
	            b64array.charAt(enc3) +
	            b64array.charAt(enc4);
        } while (i < input.length);

        return base64;
    }
}
