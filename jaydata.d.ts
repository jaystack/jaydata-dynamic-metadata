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
    
    const enum EntityState{
        Detached = 0,
        Unchanged = 10,
        Added = 20,
        Modified = 30,
        Deleted = 40
    }
    
    interface MemberDefinition{
        name: string;
        type: any;
        dataType: any;
        elementType: any;
        originalType: any;
        kind: string;
        classMember: boolean;
        set: (value:any) => void;
        get: () => any;
        value: any;
        initialValue: any;
        method: Function;
        enumerable: boolean;
        configurable: boolean;
        key: boolean;
        computed: boolean;
        storeOnObject: boolean;
        monitorChanges: boolean;
    }
    
    interface Event{
        attach(eventHandler: (sender: any, event: any) => void ): void;
        detach(eventHandler: () => void ): void;
        fire(e: any, sender: any): void;
    }

    class Base<T>{
        constructor();
        getType: () => typeof Base;
        
        static addProperty(name:string, getterOrType:string | Function, setterOrGetter?:Function, setter?:Function);
        static addMember(name:string, definition:any, isClassMember?:boolean);
        static describeField(name:string, definition:any);
        
        static hasMetadata(key:string, property?:string): boolean;
        static getAllMetadata(property?:string): any;
        static getMetadata(key:string, property?:string): any;
        static setMetadata(key:string, value:any, property?:string): void;
    }
    
    class Enum extends Base<Enum>{
        static extend(name:string, instanceDefinition:any, classDefinition?:any): Base<Enum>;
    }
    function createEnum(name:string, enumType:any, enumDefinition?:any): Base<Enum>;
    
    class Entity extends Base<Entity>{
        static extend(name:string, instanceDefinition:any, classDefinition?:any): Base<Entity>;
        
        entityState: EntityState;
        changedProperties: MemberDefinition[];
        
        propertyChanging: Event;
        propertyChanged: Event;
        propertyValidationError: Event;
        isValid: boolean;
    }
    
    class EntitySet<Ttype extends typeof Entity, T extends Entity> extends Queryable<T>{
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
        elementType: Ttype;
    }
    
    class EntityContext extends Base<EntityContext>{
        constructor(config?: any);
        onReady(): Promise<EntityContext>;
        saveChanges(): Promise<number>;
        static extend(name:string, instanceDefinition:any, classDefinition?:any): Base<EntityContext>;
    }

    class Queryable<T extends Entity | Edm.String>{
        filter(predicate: (it: T) => boolean, thisArg?: any): Queryable<T>;
        map(projection: (it: T) => any): Queryable<any>;
        orderBy(predicate: (it: any) => any): Queryable<T>;
        include(selector: string): Queryable<T>;
        skip(amount: number): Queryable<T>;
        take(amount: number): Queryable<T>;
        forEach(handler: (it: T) => void): Promise<T>;
        length(): Promise<number>;
        toArray(): Promise<T[]>;
        single(predicate: (it: T) => boolean, params?: any, handler?: (result: T) => void): Promise<T>;
        first(predicate: (it: T) => boolean, params?: any, handler?: (result: T) => void ): Promise<T>;
        removeAll(): Promise<number>;
    }
    class ServiceAction{}
    class ServiceFunction{}
    
    function implementation(name:string): typeof Base;
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

declare module "jaydata/core"{
    import $d = $data;
    export = $d;
}