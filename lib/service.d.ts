export { MetadataHandler, odatajs } from './metadataHandler';
export { Annotations } from './annotations';
export { Metadata } from './metadata';
export declare class ServiceParams {
    serviceUri: string;
    config: any;
    callback: any;
}
export declare class DynamicMetadata {
    private $data;
    private static getParam;
    constructor($data: any);
    service(serviceUri: any, config?: any, callback?: any): any;
    initService(serviceUri: any, config?: any, callback?: any): any;
    static use($data: any): void;
}
