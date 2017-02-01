import { Annotations } from './annotations'
import { JayData } from './dts'

var containsField = (obj, field, cb) => {
    // if (field in (obj || {})) {
    //     cb(obj[field])
    // }
    if (obj && field in obj && typeof obj[field] !== "undefined") {
        cb(obj[field])
    }
}

var parsebool = (b, d) => {
    if ("boolean" === typeof b) {
        return b
    }
    switch (b) {
        case "true": return true
        case "false": return false
        default: return d
    }
}

var _collectionRegex = /^Collection\((.*)\)$/

const dtsTypeMapping = {
    'Edm.Boolean': 'boolean',
    'Edm.Binary': 'Uint8Array',
    'Edm.DateTime': 'Date',
    'Edm.DateTimeOffset': 'Date',
    'Edm.Time': 'string',
    'Edm.Duration': 'string',
    'Edm.TimeOfDay': 'string',
    'Edm.Date': 'string',
    'Edm.Decimal': 'string',
    'Edm.Single': 'number',
    'Edm.Float': 'number',
    'Edm.Double': 'number',
    'Edm.Guid': 'string',
    'Edm.Int16': 'number',
    'Edm.Int32': 'number',
    'Edm.Int64': 'string',
    'Edm.Byte': 'number',
    'Edm.SByte': 'number',
    'Edm.String': 'string',
    'Edm.GeographyPoint': '$data.Geography',
    'Edm.GeographyLineString': '$data.GeographyLineString',
    'Edm.GeographyPolygon': '$data.GeographyPolygon',
    'Edm.GeographyMultiPoint': '$data.GeographyMultiPoint',
    'Edm.GeographyMultiPolygon': '$data.GeographyMultiPolygon',
    'Edm.GeographyMultiLineString': '$data.GeographyMultiLineString',
    'Edm.GeographyCollection': '$data.GeographyCollection',
    'Edm.GeometryPoint': '$data.Geometry',
    'Edm.GeometryLineString': '$data.GeometryLineString',
    'Edm.GeometryPolygon': '$data.GeometryPolygon',
    'Edm.GeometryMultiPoint': '$data.GeometryMultiPoint',
    'Edm.GeometryMultiPolygon': '$data.GeometryMultiPolygon',
    'Edm.GeometryMultiLineString': '$data.GeometryMultiLineString',
    'Edm.GeometryCollection': '$data.GeometryCollection'
};

export class Metadata {
    options: any
    metadata: any
    private $data: any
    private annotationHandler: Annotations
    private storedTypes: Object;
    constructor($data: any, options: any, metadata: any) {
        this.$data = $data;
        this.options = options || {};
        this.metadata = metadata;
        this.options.container = this.$data.Container; //this.options.container || $data.createContainer()

        this.options.baseType = this.options.baseType || '$data.Entity'
        this.options.entitySetType = this.options.entitySetType || '$data.EntitySet'
        this.options.contextType = this.options.contextType || '$data.EntityContext'
        this.options.collectionBaseType = this.options.collectionBaseType || 'Array'

        this.annotationHandler = new Annotations()

        this.storedTypes = {};
    }

    _getMaxValue(maxValue) {
        if ("number" === typeof maxValue) return maxValue
        if ("max" === maxValue) return Number.MAX_VALUE
        return parseInt(maxValue)
    }

    createTypeDefinition(propertySchema, definition) {
        containsField(propertySchema, "type", v => {
            var match = _collectionRegex.exec(v)
            if (match) {
                definition.type = this.options.collectionBaseType
                definition.elementType = match[1]
            } else {
                definition.type = v
            }
        })
    }

    createReturnTypeDefinition(propertySchema, definition) {
        containsField(propertySchema, "type", v => {
            var match = _collectionRegex.exec(v)
            if (match) {
                definition.returnType = '$data.Queryable'
                definition.elementType = match[1]
            } else {
                definition.returnType = v
            }
        })
    }


    createProperty(entityFullName, entitySchema, propertySchema) {
        var self = this;

        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition: any = {}

        this.createTypeDefinition(propertySchema, definition)

        containsField(propertySchema, "nullable", v => {
            definition.nullable = parsebool(v, true),
                definition.required = parsebool(v, true) === false
        })

        containsField(propertySchema, "maxLength", v => {
            definition.maxLength = this._getMaxValue(v)
        })

        containsField(entitySchema, "key", keys => {
            if (keys.propertyRefs.some(pr => pr.name === propertySchema.name)) {
                definition.key = true
            }
        })

        containsField(propertySchema, "annotations", v => {
            this.annotationHandler.processEntityPropertyAnnotations(entityFullName, propertySchema.name, v)
        })

        return {
            name: propertySchema.name,
            definition
        }
    }

    createNavigationProperty(entityFullName, entitySchema, propertySchema) {
        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition: any = {}

        this.createTypeDefinition(propertySchema, definition)

        containsField(propertySchema, "nullable", v => {
            definition.nullable = parsebool(v, true),
                definition.required = parsebool(v, true) === false
        })

        containsField(propertySchema, "partner", p => {
            definition.inverseProperty = p
        })

        if (!definition.inverseProperty) {
            definition.inverseProperty = '$$unbound'
        }

        containsField(propertySchema, "annotations", v => {
            this.annotationHandler.processEntityPropertyAnnotations(entityFullName, propertySchema.name, v)
        })

        return {
            name: propertySchema.name,
            definition
        }
    }

    createEntityDefinition(entitySchema, entityFullName) {
        var props = (entitySchema.properties || []).map(this.createProperty.bind(this, entityFullName, entitySchema))
        var navigationProps = (entitySchema.navigationProperties || []).map(this.createNavigationProperty.bind(this, entityFullName, entitySchema))
        props = props.concat(navigationProps)
        var result = props.reduce((p, c) => {
            p[c.name] = c.definition
            return p
        }, {})
        return result
    }

    createEntityType(entitySchema, namespace) {
        let baseType = (entitySchema.baseType ? entitySchema.baseType : this.options.baseType)
        let entityFullName = `${namespace}.${entitySchema.name}`
        let definition = this.createEntityDefinition(entitySchema, entityFullName)

        let staticDefinition: any = {}

        containsField(entitySchema, "openType", v => {
            if (parsebool(v, false)) {
                staticDefinition.openType = { value: true }
            }
        })

        containsField(entitySchema, "annotations", v => {
            this.annotationHandler.processEntityAnnotations(entityFullName, v)
        })

        return {
            namespace,
            typeName: entityFullName,
            baseType,
            params: [entityFullName, this.options.container, definition, staticDefinition],
            definition,
            type: 'entity'
        }
    }

    createEnumOption(enumFullName, entitySchema, propertySchema, i) {
        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition: any = {
            name: propertySchema.name,
            index: i
        }

        containsField(propertySchema, "value", value => {
            var v = +value
            if (!isNaN(v)) {
                definition.value = v
            }
        })

        containsField(propertySchema, "annotations", v => {
            this.annotationHandler.processEntityPropertyAnnotations(enumFullName, propertySchema.name, v, true)
        })

        return definition
    }

    createEnumDefinition(enumSchema, enumFullName) {
        var props = (enumSchema.members || []).map(this.createEnumOption.bind(this, enumFullName, enumSchema))
        return props
    }

    createEnumType(enumSchema, namespace) {
        var self = this;
        let enumFullName = `${namespace}.${enumSchema.name}`
        let definition = this.createEnumDefinition(enumSchema, enumFullName)

        containsField(enumSchema, "annotations", v => {
            this.annotationHandler.processEntityAnnotations(enumFullName, v, true)
        })

        return {
            namespace,
            typeName: enumFullName,
            baseType: '$data.Enum',
            params: [enumFullName, this.options.container, enumSchema.underlyingType, definition],
            definition,
            type: 'enum'
        }
    }


    createEntitySetProperty(entitySetSchema, contextSchema) {
        //var c = this.options.container
        var t = entitySetSchema.entityType //c.classTypes[c.classNames[entitySetSchema.entityType]] // || entitySetSchema.entityType
        var prop = {
            name: entitySetSchema.name,
            definition: {
                type: this.options.entitySetType,
                elementType: t
            }
        }

        containsField(entitySetSchema, "annotations", v => {
            this.annotationHandler.processEntitySetAnnotations(t, v)
        })

        return prop
    }

    indexBy(fieldName, pick) {
        return [(p, c) => { p[c[fieldName]] = c[pick]; return p }, {}]
    }

    createContextDefinition(contextSchema, namespace) {
        var props = (contextSchema.entitySets || []).map(es => this.createEntitySetProperty(es, contextSchema))

        var result = props.reduce(...this.indexBy("name", "definition"))
        return result
    }

    createContextType(contextSchema, namespace) {
        if (Array.isArray(contextSchema)) {
            throw new Error("Array type is not supported here")
        }
        var definition = this.createContextDefinition(contextSchema, namespace)
        var baseType = this.options.contextType
        var typeName = `${namespace}.${contextSchema.name}`
        var contextImportMethods = []
        contextSchema.actionImports && contextImportMethods.push(...contextSchema.actionImports)
        contextSchema.functionImports && contextImportMethods.push(...contextSchema.functionImports)

        return {
            namespace,
            typeName,
            baseType,
            params: [typeName, this.options.container, definition],
            definition,
            type: 'context',
            contextImportMethods
        }
    }


    createMethodParameter(parameter, definition) {
        var paramDef = {
            name: parameter.name
        }

        this.createTypeDefinition(parameter, paramDef)

        definition.params.push(paramDef)
    }

    applyBoundMethod(actionInfo, ns, typeDefinitions, type) {
        let definition = {
            type,
            namespace: ns,
            returnType: null,
            params: []
        }

        containsField(actionInfo, "returnType", value => {
            this.createReturnTypeDefinition(value, definition)
        })

        let parameters = [].concat(actionInfo.parameters)
        parameters.forEach((p) => this.createMethodParameter(p, definition))

        if (parsebool(actionInfo.isBound, false)) {
            let bindingParameter = definition.params.shift()

            if (bindingParameter.type === this.options.collectionBaseType) {
                let filteredContextDefinitions = typeDefinitions.filter((d) => d.namespace === ns && d.type === 'context')
                filteredContextDefinitions.forEach(ctx => {
                    for (var setName in ctx.definition) {
                        let set = ctx.definition[setName]
                        if (set.elementType === bindingParameter.elementType) {
                            set.actions = set.actions || {}
                            set.actions[actionInfo.name] = definition
                        }
                    }
                })
            } else {
                let filteredTypeDefinitions = typeDefinitions.filter((d) => d.typeName === bindingParameter.type && d.type === 'entity')
                filteredTypeDefinitions.forEach(t => {
                    t.definition[actionInfo.name] = definition
                })
            }
        } else {
            delete definition.namespace

            let methodFullName = ns + '.' + actionInfo.name
            let filteredContextDefinitions = typeDefinitions.filter((d) => d.type === 'context')
            filteredContextDefinitions.forEach((ctx) => {
                ctx.contextImportMethods.forEach(methodImportInfo => {
                    if (methodImportInfo.action === methodFullName || methodImportInfo.function === methodFullName) {
                        ctx.definition[actionInfo.name] = definition
                    }
                })
            })

        }
    }

    processMetadata(createdTypes?) {
        var types = createdTypes || []
        var typeDefinitions = []
        var serviceMethods = []

        containsField(this.metadata, "references", references => {
            references.forEach(ref => {
                containsField(ref, "includes", includes => {
                    includes.forEach(include => {
                        this.annotationHandler.addInclude(include)
                    })
                })
            })
        })

        var dtsModules = {};
        types.dts = '/*//////////////////////////////////////////////////////////////////////////////////////\n' +
                    '//////     Autogenerated by JaySvcUtil http://JayData.org for more info        /////////\n' +
                    '//////                      OData  V4  TypeScript                              /////////\n' +
                    '//////////////////////////////////////////////////////////////////////////////////////*/\n\n';

        types.dts += JayData.src + '\n\n';
        //types.dts += 'declare module Edm {\n' + Object.keys(dtsTypeMapping).map(t => '    type ' + t.split('.')[1] + ' = ' + dtsTypeMapping[t] + ';').join('\n') + '\n}\n\n';

        var self = this;
        this.metadata.dataServices.schemas.forEach(schema => {
            var ns = schema.namespace
            dtsModules[ns] = ['declare module ' + ns + ' {', '}'];

            if (schema.enumTypes) {
                let enumTypes = schema.enumTypes.map(ct => this.createEnumType(ct, ns))
                typeDefinitions.push(...enumTypes)
            }

            if (schema.complexTypes) {
                let complexTypes = schema.complexTypes.map(ct => this.createEntityType(ct, ns))
                typeDefinitions.push(...complexTypes)
            }

            if (schema.entityTypes) {
                let entityTypes = schema.entityTypes.map(et => this.createEntityType(et, ns))
                typeDefinitions.push(...entityTypes)
            }

            if (schema.actions) {
                serviceMethods.push(...schema.actions.map(m => defs => this.applyBoundMethod(m, ns, defs, '$data.ServiceAction')))
            }

            if (schema.functions) {
                serviceMethods.push(...schema.functions.map(m => defs => this.applyBoundMethod(m, ns, defs, '$data.ServiceFunction')))
            }

            if (schema.entityContainer) {
                let contexts = schema.entityContainer.map(ctx => this.createContextType(ctx, self.options.namespace || ns))
                typeDefinitions.push(...contexts)
            }

            //console.log('annotations', schema)
            containsField(schema, 'annotations', (annotations) => {
                annotations.forEach((annot) => {
                    containsField(annot, "target", target => {
                        containsField(annot, "annotations", v => {
                            this.annotationHandler.processSchemaAnnotations(target, v, annot.qualifier)
                        })
                    })
                })
            })
        })

        serviceMethods.forEach(m => m(typeDefinitions))

        var contextFullName;
        types.src = '(function(mod) {\n' +
            '  if (typeof exports == "object" && typeof module == "object") return mod(exports, require("jaydata/core")); // CommonJS\n' +
            '  if (typeof define == "function" && define.amd) return define(["exports", "jaydata/core"], mod); // AMD\n' +
            '  mod($data.generatedContext || ($data.generatedContext = {}), $data); // Plain browser env\n' +
            '})(function(exports, $data) {\n\n' +
            'exports.$data = $data;\n\n' +
            'var types = {};\n\n';
        typeDefinitions = this.orderTypeDefinitions(typeDefinitions)
        types.push(...typeDefinitions.map((d) => {
            this.annotationHandler.preProcessAnnotation(d)
            this.storeExportable( d.params[0] );

            var dtsm = dtsModules[d.namespace];
            if (!dtsm){
                dtsm = dtsModules[d.namespace] = ['declare module ' + d.namespace + ' {', '}'];
            }
            var dtsPart = [];

            var srcPart = '';
            if (d.baseType == '$data.Enum') {
                dtsPart.push('    export enum ' + d.typeName.split('.').pop() + ' {');
                if (d.params[3] && Object.keys(d.params[3]).length > 0){
                    Object.keys(d.params[3]).forEach(dp => dtsPart.push('        ' + d.params[3][dp].name + ','));
                }
                srcPart += 'types["' + d.params[0] + '"] = $data.createEnum("' + d.params[0] + '", [\n' +
                    Object.keys(d.params[3]).map(dp => '  ' + this._createPropertyDefString(d.params[3][dp])).join(',\n') +
                    '\n]);\n\n';
            } else {
                dtsPart.push('    export class ' + d.typeName.split('.').pop() + ' extends ' + d.baseType + ' {');
                if (d.baseType == self.options.contextType){
                    dtsPart.push('        onReady(): Promise<' + d.typeName.split('.').pop() + '>;');
                    dtsPart.push('');
                }else{
                    dtsPart.push('        constructor();');
                    var ctr = '        constructor(initData: { ';
                    if (d.params[2] && Object.keys(d.params[2]).length > 0){
                        ctr += Object.keys(d.params[2]).map(dp => dp + '?: ' + (d.params[2][dp].type == 'Array' ? d.params[2][dp].elementType + '[]' : d.params[2][dp].type)).join('; ');
                    }
                    ctr += ' });';
                    dtsPart.push(ctr);
                    dtsPart.push('');
                }

                var typeName = d.baseType;
                if (d.baseType == this.options.contextType){
                    srcPart += 'exports.type = ';
                    contextFullName = d.typeName;
                }
                srcPart += 'types["' + d.params[0] + '"] = ' +
                    (typeName == this.options.baseType || typeName == this.options.contextType ? ('$data("' + typeName + '")') : 'types["' + typeName + '"]') +
                    '.extend("' + d.params[0] + '", ';
                if (d.params[2] && Object.keys(d.params[2]).length > 0){
                    srcPart += '{\n' + Object.keys(d.params[2]).map(dp => '  ' + dp + ': ' + this._createPropertyDefString(d.params[2][dp])).join(',\n') + '\n}';
                    if (d.baseType == this.options.contextType){
                        Object.keys(d.params[2]).forEach(dp => dtsPart.push('        ' + dp + ': ' + this._typeToTS(d.params[2][dp].type, d.params[2][dp].elementType, d.params[2][dp]) + ';'));
                    }else{
                        Object.keys(d.params[2]).forEach(dp => dtsPart.push('        ' + dp + ': ' + this._typeToTS(d.params[2][dp].type, d.params[2][dp].elementType, d.params[2][dp]) + ';'));
                    }
                }
                else srcPart += 'null';
                if (d.params[3] && Object.keys(d.params[3]).length > 0){
                    srcPart += ', {\n' + Object.keys(d.params[3]).map(dp => '  ' + dp + ': ' + this._createPropertyDefString(d.params[3][dp])).join(',\n') + '\n}';
                }
                srcPart += ');\n\n';
            }
            types.src += srcPart;

            dtsPart.push('    }');
            dtsm.splice(1, 0, dtsPart.join('\n'));

            if (this.options.debug) console.log('Type generated:', d.params[0]);

            if (this.options.generateTypes !== false) {
                var baseType = this.options.container.resolveType(d.baseType)
                var type = baseType.extend.apply(baseType, d.params)
                this.annotationHandler.addAnnotation(type)
                return type
            }
        }));

        this.addExportables( types );

        types.src += 'var ctxType = exports.type;\n' +
            'exports.factory = function(config){\n' +
            '  if (ctxType){\n' +
            '    var cfg = $data.typeSystem.extend({\n' +
            '      name: "oData",\n' +
            '      oDataServiceHost: "' + (this.options.url && this.options.url.replace('/$metadata', '') || '') + '",\n' +
            '      withCredentials: ' + (this.options.withCredentials || false) + ',\n' +
            '      maxDataServiceVersion: "' + (this.options.maxDataServiceVersion || '4.0') + '"\n' +
            '    }, config);\n' +
            '    return new ctxType(cfg);\n' +
            '  }else{\n' +
            '    return null;\n' +
            '  }\n' +
            '};\n\n';

        if (this.options.autoCreateContext) {
            var contextName = typeof this.options.autoCreateContext == 'string' ? this.options.autoCreateContext : 'context';
            types.src += 'exports["' + contextName + '"] = exports.factory();\n\n';
        }
        types.src += this.annotationHandler.annotationsText()

        types.src += '});';

        // declare modules
        types.dts += Object.keys(dtsModules)
            .filter(m => dtsModules[m] && dtsModules[m].length > 2)
            .map(m => dtsModules[m].join('\n\n'))
            .join('\n\n');

        // export modules
        types.dts += Object.keys(dtsModules)
            .filter(m => dtsModules[m] && dtsModules[m].length > 2)
            .map(m => m.split(".")[0])
            .filter((v, i, a) => a.indexOf(v) === i) // distinct
            .map(m => '\n\nexport {'+m+' as '+m+'}')
            .join('');

        if (contextFullName){
            var mod = ['\n\nexport var type: typeof ' + contextFullName + ';',
                'export var factory: (config:any) => ' + contextFullName + ';'];
            if (this.options.autoCreateContext){
                var contextName = typeof this.options.autoCreateContext == 'string' ? this.options.autoCreateContext : 'context';
                mod.push('export var ' + contextName + ': ' + contextFullName + ';');
            }
            types.dts += mod.join('\n');
        }

        if (this.options.generateTypes === false) {
            types.length = 0;
        }

        return types;
    }
    private _createPropertyDefString(definition){
        if(definition.concurrencyMode){
            return JSON.stringify(definition).replace('"concurrencyMode":"fixed"}', '"concurrencyMode":$data.ConcurrencyMode.Fixed}')
        } else {
            return JSON.stringify(definition)
        }
    }

    private _typeToTS(type, elementType, definition){
        if (type == this.options.entitySetType){
            return '$data.EntitySet<typeof ' + elementType + ', ' + elementType + '>';
        }else if (type == '$data.Queryable'){
            return '$data.Queryable<' + elementType + '>';
        }else if (type == this.options.collectionBaseType){
            return elementType + '[]';
        }else if (type == '$data.ServiceAction'){
            return '{ (' + (definition.params.length > 0 ? definition.params.map(p => p.name + ': ' + this._typeToTS(p.type, p.elementType, p)).join(', ') : '') + '): Promise<void>; }';
        }else if (type == '$data.ServiceFunction'){
            var t = this._typeToTS(definition.returnType, definition.elementType, definition);
            if (t.indexOf('$data.Queryable') < 0) t = 'Promise<' + t + '>';
            return '{ (' + (definition.params.length > 0 ? definition.params.map(p => p.name + ': ' + this._typeToTS(p.type, p.elementType, p)).join(', ') : '') + '): ' + t + '; }';
        }else return type;
    }

    orderTypeDefinitions(typeDefinitions) {
        let contextTypes = typeDefinitions.filter(t => t.type === 'context')
        let ordered = []
        let dependants = [].concat(typeDefinitions.filter(t => t.type !== 'context'))
        let addedTypes
        let baseType = this.options.baseType

        let dependantCount = Number.MAX_VALUE
        while (dependants.length) {
            var dependantItems = [].concat(dependants)
            dependants.length = 0

            dependantItems.forEach(typeDef => {
                if (dependantCount === dependantItems.length ||
                    typeDef.type !== "entity" ||
                    typeDef.baseType === baseType ||
                    ordered.some(t => t.typeName === typeDef.baseType)
                ) {
                    ordered.push(typeDef)
                } else {
                    dependants.push(typeDef)
                }
            })

            dependantCount = dependantItems.length
        }

        return ordered.concat(contextTypes);
    }

    private storeExportable( typesStr )
    {
        let typesArr = typesStr.split(".");
        let container = this.storedTypes;

        typesArr.forEach(( current )=>
        {
            if(typesArr[typesArr.length-1] === current)
            {
                container[current] = "@@" + typesStr+"@@";
            }
            else
            {
                if( !container[current] )
                {
                    container[current] = {};
                }

                container = container[current];
            }
        });
    }

    private addExportables( meta )
    {
        for( let key in this.storedTypes )
        {
            let types = "exports." + key + " = " +
                JSON.stringify(this.storedTypes[key], null, 2)
                .replace(/"@@/g,"types[\"")
                .replace(/@@"/g,"\"]") + ";\n\n";

            meta.src += types
        }
    }
}
