/// <reference types="es6-promise" />
export declare var odatajs: any;
export declare class MetadataHandler {
    options: any;
    prepareRequest: Function;
    oData: any;
    private $data;
    constructor($data: any, options: any);
    parse(text: string): any;
    load(): Promise<any>;
    private _createFactoryFunc(ctxType);
    private _appendBasicAuth(request, user, password, withCredentials);
    private __encodeBase64(val);
}
