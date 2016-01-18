export declare class Metadata {
    options: any;
    metadata: any;
    private $data;
    constructor($data: any, options: any, metadata: any);
    _getMaxValue(maxValue: any): any;
    createTypeDefinition(propertySchema: any, definition: any): void;
    createReturnTypeDefinition(propertySchema: any, definition: any): void;
    createProperty(entitySchema: any, propertySchema: any): {
        name: any;
        definition: any;
    };
    createNavigationProperty(entitySchema: any, propertySchema: any): {
        name: any;
        definition: any;
    };
    createEntityDefinition(entitySchema: any): any;
    createEntityType(entitySchema: any, namespace: any): {
        namespace: any;
        typeName: string;
        baseType: any;
        params: any[];
        definition: any;
        type: string;
    };
    createEnumOption(entitySchema: any, propertySchema: any, i: any): any;
    createEnumDefinition(enumSchema: any): any;
    createEnumType(enumSchema: any, namespace: any): {
        namespace: any;
        typeName: string;
        baseType: any;
        params: any[];
        definition: any;
        type: string;
    };
    createEntitySetProperty(entitySetSchema: any, contextSchema: any): {
        name: any;
        definition: {
            type: any;
            elementType: any;
        };
    };
    indexBy(fieldName: any, pick: any): {}[];
    createContextDefinition(contextSchema: any, namespace: any): any;
    createContextType(contextSchema: any, namespace: any): {
        namespace: any;
        typeName: string;
        baseType: any;
        params: any[];
        definition: any;
        type: string;
        contextImportMethods: any[];
    };
    createMethodParameter(parameter: any, definition: any): void;
    applyBoundMethod(actionInfo: any, ns: any, typeDefinitions: any, type: any): void;
    processMetadata(createdTypes?: any): any;
}
