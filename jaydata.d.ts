declare module $data{
    class Geography{}
    class GeographyLineString{}
    class GeographyPolygon{}
    class GeographyMultiPoint{}
    class GeographyMultiPolygon{}
    class GeographyMultiLineString{}
    class GeographyCollection{}

    class Geometry{}
    class GeometryLineString{}
    class GeometryPolygon{}
    class GeometryMultiPoint{}
    class GeometryMultiPolygon{}
    class GeometryMultiLineString{}
    class GeometryCollection{}

    class Enum{}
    class Entity{}
    class EntitySet<T extends Entity>{
        add(item: T): T;
        add(initData: {}): T;
        attach(item: T): void;
        attach(item: {}): void;
        attachOrGet(item: T): T;
        attachOrGet(item: {}): T;
        detach(item: T): void;
        detach(item: {}): void;
        remove(item: T): void;
        remove(item: {}): void;
        elementType: T;
    }
    class EntityContext{
        constructor(config?: any);
        onReady(): Promise<EntityContext>;
        saveChanges(): Promise<number>;

    }

    class Queryable<T extends Entity>{
        filter(predicate: (it: T) => boolean, thisArg?: any): Queryable<T>;
        map(projection: (it: T) => any): Queryable<any>;
        orderBy(predicate: (it: any) => any): Queryable<T>;
        include(selector: string): Queryable<T>;
        skip(amount: number): Queryable<T>;
        take(amount: number): Queryable<T>;
        forEach(handler: (it: any) => void): Promise<T>;
        length(): Promise<number>;
        toArray(): Promise<T[]>;
        single(predicate: (it: T) => boolean, params?: any, handler?: (result: T) => void): Promise<T>;
        first(predicate: (it: T) => boolean, params?: any, handler?: (result: T) => void ): Promise<T>;
        removeAll(): Promise<number>;
    }
    class ServiceAction{}
    class ServiceFunction{}
}

interface Thenable<R> {
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Thenable<U>;
}
declare class Promise<R> implements Thenable<R> {
    constructor(callback: (resolve : (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void);
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Promise<U>;
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Promise<U>;
    catch<U>(onRejected?: (error: any) => U | Thenable<U>): Promise<U>;
}

declare module Edm {
    type Boolean = boolean;
    type Binary = Uint8Array;
    type DateTime = Date;
    type DateTimeOffset = Date;
    type Duration = string;
    type TimeOfDay = string;
    type Date = string;
    type Time = string;
    type Decimal = string;
    type Single = number;
    type Float = number;
    type Double = number;
    type Guid = string;
    type Int16 = number;
    type Int32 = number;
    type Int64 = string;
    type Byte = number;
    type SByte = number;
    type String = string;
    type GeographyPoint = $data.Geography;
    type GeographyLineString = $data.GeographyLineString;
    type GeographyPolygon = $data.GeographyPolygon;
    type GeographyMultiPoint = $data.GeographyMultiPoint;
    type GeographyMultiPolygon = $data.GeographyMultiPolygon;
    type GeographyMultiLineString = $data.GeographyMultiLineString;
    type GeographyCollection = $data.GeographyCollection;
    type GeometryPoint = $data.Geometry;
    type GeometryLineString = $data.GeometryLineString;
    type GeometryPolygon = $data.GeometryPolygon;
    type GeometryMultiPoint = $data.GeometryMultiPoint;
    type GeometryMultiPolygon = $data.GeometryMultiPolygon;
    type GeometryMultiLineString = $data.GeometryMultiLineString;
    type GeometryCollection = $data.GeometryCollection;
}
