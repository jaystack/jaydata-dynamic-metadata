/// <reference path="../typings/tsd.d.ts" />
export { MetadataHandler } from './metadataHandler';
export declare class ServiceParams {
    serviceUri: string;
    config: any;
    callback: any;
}
export declare class DynamicMetadata {
    private $data;
    private static getParam;
    constructor($data: any);
    service(serviceUri: any, config?: any, callback?: any): IPromise;
    initService(serviceUri: any, config?: any, callback?: any): IPromise;
    static use($data: any): void;
}
