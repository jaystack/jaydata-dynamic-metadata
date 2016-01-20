declare module "jaydata-error-handler" {
    class Exception extends Error {
        name: string;
        message: string;
        data: any;
        constructor(message: string, name?: string, data?: any);
        _getStackTrace(): void;
    }
    class Guard {
        static requireValue(name: string, value: any): void;
        static requireType(name: string, value: any, typeOrTypes: any): boolean;
        static raise(exception: string): void;
        static raise(exception: Exception): void;
        static isNullOrUndefined(value: any): boolean;
    }
}
