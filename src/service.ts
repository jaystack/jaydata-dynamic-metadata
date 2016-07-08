import * as extend from 'extend';
import { MetadataHandler } from './metadataHandler';
import { Exception } from 'jaydata-error-handler';
import { PromiseHandler } from 'jaydata-promise-handler';
export { MetadataHandler, odatajs } from './metadataHandler';

export class ServiceParams{
	public serviceUri:string
	public config:any = {}
	public callback:any
}

export class DynamicMetadata{
	private $data:any
	private static getParam:Function = function(paramValue:any, params:ServiceParams) {
		switch (typeof paramValue) {
            case 'object':
                if (typeof paramValue.success === 'function' || typeof paramValue.error === 'function') {
                    params.callback = paramValue;
                } else {
                    params.config = paramValue;
                }
                break;
            case 'function':
                params.callback = paramValue;
                break;
            default:
                break;
        }
	}

	constructor($data){
		this.$data = $data;
	}

	service(serviceUri:any, config?:any, callback?:any){
		var params = new ServiceParams();
		DynamicMetadata.getParam(config, params);
		DynamicMetadata.getParam(callback, params);

		if (typeof serviceUri == 'object'){
			extend(params.config, serviceUri);
		}else if (typeof serviceUri == 'string'){
			params.config = params.config || {};
			params.config.url = serviceUri;
		}

		var pHandler = this.$data && this.$data.PromiseHandler ? new this.$data.PromiseHandler() : new PromiseHandler();
    	var _callback = pHandler.createCallback(params.callback);

		var self = this;
		new MetadataHandler(this.$data, params.config).load().then(function(factory:any){
			var type = factory.type;
            //register to local store
            var storeAlias = params.config.serviceName || params.config.storeAlias;
            if (storeAlias && 'addStore' in self.$data) {
                self.$data.addStore(storeAlias, factory, params.config.isDefault === undefined || params.config.isDefault);
            }

			_callback.success(factory, type);
		}, function(err){
			_callback.error(err);
		});

		return pHandler.getPromise();
	}

	initService(serviceUri:any, config?:any, callback?:any){
		var params = new ServiceParams();
		DynamicMetadata.getParam(config, params);
		DynamicMetadata.getParam(callback, params);

		if (typeof serviceUri == 'object'){
			extend(params.config, serviceUri);
		}else if (typeof serviceUri == 'string'){
			params.config = params.config || {};
			params.config.url = serviceUri;
		}

        var pHandler = this.$data && this.$data.PromiseHandler ? new this.$data.PromiseHandler() : new PromiseHandler();
    	var _callback = pHandler.createCallback(params.callback);

		this.service(params.config.url, params.config, {
	        success: function(factory){
	            var ctx = factory()
	            if(ctx){
					return ctx.onReady().then((ctx) => {
						ctx.factory = factory;
						ctx.type = factory.type;
						_callback.success(ctx, factory, factory.type);
					}, _callback.error);
	            }
	            return _callback.error(new Exception("Missing Context Type"))
	        },
	        error: _callback.error
	    });

	    return pHandler.getPromise();
	}

	static use($data){
		var dynamicMetadata = new DynamicMetadata($data);
		$data.service = dynamicMetadata.service;
		$data.initService = dynamicMetadata.initService;
	}
}
