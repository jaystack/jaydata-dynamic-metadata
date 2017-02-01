export declare class Metadata {
    options: any;
    metadata: any;
    private $data;
    private annotationHandler;
    private storedTypes;
    constructor($data: any, options: any, metadata: any);
    _getMaxValue(maxValue: any): number;
    createTypeDefinition(propertySchema: any, definition: any): void;
    createReturnTypeDefinition(propertySchema: any, definition: any): void;
    createProperty(entityFullName: any, entitySchema: any, propertySchema: any): {
        name: any;
        definition: any;
    };
    createNavigationProperty(entityFullName: any, entitySchema: any, propertySchema: any): {
        name: any;
        definition: any;
    };
    createEntityDefinition(entitySchema: any, entityFullName: any): any;
    createEntityType(entitySchema: any, namespace: any): {
        namespace: any;
        typeName: string;
        baseType: any;
        params: any[];
        definition: any;
        type: string;
    };
    createEnumOption(enumFullName: any, entitySchema: any, propertySchema: any, i: any): any;
    createEnumDefinition(enumSchema: any, enumFullName: any): any;
    createEnumType(enumSchema: any, namespace: any): {
        namespace: any;
        typeName: string;
        baseType: string;
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
    private _createPropertyDefString(definition);
    private _typeToTS(type, elementType, definition);
    orderTypeDefinitions(typeDefinitions: any): any[];
    private storeExportable(typesStr);
    private addExportables(meta);
}
