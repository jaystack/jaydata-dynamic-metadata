declare class CallbackSettings{
	success:Function
	error:Function
	notify:Function
}
interface IPromise{
	always:Function
	done:Function
	fail:Function
	isRejected:Function
	isResolved:Function
	pipe:Function
	progress:Function
	promise:Function
	state:Function
	then:Function
}
declare class PromiseHandler{
	createCallback(callback:Function):CallbackSettings;
	getPromise():IPromise;
	static compatibilityMode();
	static use($data:any);
}

declare module "jaydata-promise-handler"{
	var foo: typeof PromiseHandler;
	module promiseHandler{
		export var PromiseHandler: typeof foo;
	}
	export = promiseHandler;
}
