"use strict";
var annotations_1 = require("./annotations");
var dts_1 = require("./dts");
var containsField = function (obj, field, cb) {
    // if (field in (obj || {})) {
    //     cb(obj[field])
    // }
    if (obj && field in obj && typeof obj[field] !== "undefined") {
        cb(obj[field]);
    }
};
var parsebool = function (b, d) {
    if ("boolean" === typeof b) {
        return b;
    }
    switch (b) {
        case "true": return true;
        case "false": return false;
        default: return d;
    }
};
var _collectionRegex = /^Collection\((.*)\)$/;
var dtsTypeMapping = {
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
var Metadata = (function () {
    function Metadata($data, options, metadata) {
        this.$data = $data;
        this.options = options || {};
        this.metadata = metadata;
        this.options.container = this.$data.Container; //this.options.container || $data.createContainer()
        this.options.baseType = this.options.baseType || '$data.Entity';
        this.options.entitySetType = this.options.entitySetType || '$data.EntitySet';
        this.options.contextType = this.options.contextType || '$data.EntityContext';
        this.options.collectionBaseType = this.options.collectionBaseType || 'Array';
        this.annotationHandler = new annotations_1.Annotations();
        this.storedTypes = {};
    }
    Metadata.prototype._getMaxValue = function (maxValue) {
        if ("number" === typeof maxValue)
            return maxValue;
        if ("max" === maxValue)
            return Number.MAX_VALUE;
        return parseInt(maxValue);
    };
    Metadata.prototype.createTypeDefinition = function (propertySchema, definition) {
        var _this = this;
        containsField(propertySchema, "type", function (v) {
            var match = _collectionRegex.exec(v);
            if (match) {
                definition.type = _this.options.collectionBaseType;
                definition.elementType = match[1];
            }
            else {
                definition.type = v;
            }
        });
    };
    Metadata.prototype.createReturnTypeDefinition = function (propertySchema, definition) {
        containsField(propertySchema, "type", function (v) {
            var match = _collectionRegex.exec(v);
            if (match) {
                definition.returnType = '$data.Queryable';
                definition.elementType = match[1];
            }
            else {
                definition.returnType = v;
            }
        });
    };
    Metadata.prototype.createProperty = function (entityFullName, entitySchema, propertySchema) {
        var _this = this;
        var self = this;
        if (!propertySchema) {
            propertySchema = entitySchema;
            entitySchema = undefined;
        }
        var definition = {};
        this.createTypeDefinition(propertySchema, definition);
        containsField(propertySchema, "nullable", function (v) {
            definition.nullable = parsebool(v, true),
                definition.required = parsebool(v, true) === false;
        });
        containsField(propertySchema, "maxLength", function (v) {
            definition.maxLength = _this._getMaxValue(v);
        });
        containsField(entitySchema, "key", function (keys) {
            if (keys.propertyRefs.some(function (pr) { return pr.name === propertySchema.name; })) {
                definition.key = true;
            }
        });
        containsField(propertySchema, "annotations", function (v) {
            _this.annotationHandler.processEntityPropertyAnnotations(entityFullName, propertySchema.name, v);
        });
        return {
            name: propertySchema.name,
            definition: definition
        };
    };
    Metadata.prototype.createNavigationProperty = function (entityFullName, entitySchema, propertySchema) {
        var _this = this;
        if (!propertySchema) {
            propertySchema = entitySchema;
            entitySchema = undefined;
        }
        var definition = {};
        this.createTypeDefinition(propertySchema, definition);
        containsField(propertySchema, "nullable", function (v) {
            definition.nullable = parsebool(v, true),
                definition.required = parsebool(v, true) === false;
        });
        containsField(propertySchema, "partner", function (p) {
            definition.inverseProperty = p;
        });
        if (!definition.inverseProperty) {
            definition.inverseProperty = '$$unbound';
        }
        containsField(propertySchema, "annotations", function (v) {
            _this.annotationHandler.processEntityPropertyAnnotations(entityFullName, propertySchema.name, v);
        });
        return {
            name: propertySchema.name,
            definition: definition
        };
    };
    Metadata.prototype.createEntityDefinition = function (entitySchema, entityFullName) {
        var props = (entitySchema.properties || []).map(this.createProperty.bind(this, entityFullName, entitySchema));
        var navigationProps = (entitySchema.navigationProperties || []).map(this.createNavigationProperty.bind(this, entityFullName, entitySchema));
        props = props.concat(navigationProps);
        var result = props.reduce(function (p, c) {
            p[c.name] = c.definition;
            return p;
        }, {});
        return result;
    };
    Metadata.prototype.createEntityType = function (entitySchema, namespace) {
        var _this = this;
        var baseType = (entitySchema.baseType ? entitySchema.baseType : this.options.baseType);
        var entityFullName = namespace + "." + entitySchema.name;
        var definition = this.createEntityDefinition(entitySchema, entityFullName);
        var staticDefinition = {};
        containsField(entitySchema, "openType", function (v) {
            if (parsebool(v, false)) {
                staticDefinition.openType = { value: true };
            }
        });
        containsField(entitySchema, "annotations", function (v) {
            _this.annotationHandler.processEntityAnnotations(entityFullName, v);
        });
        return {
            namespace: namespace,
            typeName: entityFullName,
            baseType: baseType,
            params: [entityFullName, this.options.container, definition, staticDefinition],
            definition: definition,
            type: 'entity'
        };
    };
    Metadata.prototype.createEnumOption = function (enumFullName, entitySchema, propertySchema, i) {
        var _this = this;
        if (!propertySchema) {
            propertySchema = entitySchema;
            entitySchema = undefined;
        }
        var definition = {
            name: propertySchema.name,
            index: i
        };
        containsField(propertySchema, "value", function (value) {
            var v = +value;
            if (!isNaN(v)) {
                definition.value = v;
            }
        });
        containsField(propertySchema, "annotations", function (v) {
            _this.annotationHandler.processEntityPropertyAnnotations(enumFullName, propertySchema.name, v, true);
        });
        return definition;
    };
    Metadata.prototype.createEnumDefinition = function (enumSchema, enumFullName) {
        var props = (enumSchema.members || []).map(this.createEnumOption.bind(this, enumFullName, enumSchema));
        return props;
    };
    Metadata.prototype.createEnumType = function (enumSchema, namespace) {
        var _this = this;
        var self = this;
        var enumFullName = namespace + "." + enumSchema.name;
        var definition = this.createEnumDefinition(enumSchema, enumFullName);
        containsField(enumSchema, "annotations", function (v) {
            _this.annotationHandler.processEntityAnnotations(enumFullName, v, true);
        });
        return {
            namespace: namespace,
            typeName: enumFullName,
            baseType: '$data.Enum',
            params: [enumFullName, this.options.container, enumSchema.underlyingType, definition],
            definition: definition,
            type: 'enum'
        };
    };
    Metadata.prototype.createEntitySetProperty = function (entitySetSchema, contextSchema) {
        var _this = this;
        //var c = this.options.container
        var t = entitySetSchema.entityType; //c.classTypes[c.classNames[entitySetSchema.entityType]] // || entitySetSchema.entityType
        var prop = {
            name: entitySetSchema.name,
            definition: {
                type: this.options.entitySetType,
                elementType: t
            }
        };
        containsField(entitySetSchema, "annotations", function (v) {
            _this.annotationHandler.processEntitySetAnnotations(t, v);
        });
        return prop;
    };
    Metadata.prototype.indexBy = function (fieldName, pick) {
        return [function (p, c) { p[c[fieldName]] = c[pick]; return p; }, {}];
    };
    Metadata.prototype.createContextDefinition = function (contextSchema, namespace) {
        var _this = this;
        var props = (contextSchema.entitySets || []).map(function (es) { return _this.createEntitySetProperty(es, contextSchema); });
        var result = props.reduce.apply(props, this.indexBy("name", "definition"));
        return result;
    };
    Metadata.prototype.createContextType = function (contextSchema, namespace) {
        if (Array.isArray(contextSchema)) {
            throw new Error("Array type is not supported here");
        }
        var definition = this.createContextDefinition(contextSchema, namespace);
        var baseType = this.options.contextType;
        var typeName = namespace + "." + contextSchema.name;
        var contextImportMethods = [];
        contextSchema.actionImports && contextImportMethods.push.apply(contextImportMethods, contextSchema.actionImports);
        contextSchema.functionImports && contextImportMethods.push.apply(contextImportMethods, contextSchema.functionImports);
        return {
            namespace: namespace,
            typeName: typeName,
            baseType: baseType,
            params: [typeName, this.options.container, definition],
            definition: definition,
            type: 'context',
            contextImportMethods: contextImportMethods
        };
    };
    Metadata.prototype.createMethodParameter = function (parameter, definition) {
        var paramDef = {
            name: parameter.name
        };
        this.createTypeDefinition(parameter, paramDef);
        definition.params.push(paramDef);
    };
    Metadata.prototype.applyBoundMethod = function (actionInfo, ns, typeDefinitions, type) {
        var _this = this;
        var definition = {
            type: type,
            namespace: ns,
            returnType: null,
            params: []
        };
        containsField(actionInfo, "returnType", function (value) {
            _this.createReturnTypeDefinition(value, definition);
        });
        var parameters = [].concat(actionInfo.parameters);
        parameters.forEach(function (p) { return _this.createMethodParameter(p, definition); });
        if (parsebool(actionInfo.isBound, false)) {
            var bindingParameter_1 = definition.params.shift();
            if (bindingParameter_1.type === this.options.collectionBaseType) {
                var filteredContextDefinitions = typeDefinitions.filter(function (d) { return d.namespace === ns && d.type === 'context'; });
                filteredContextDefinitions.forEach(function (ctx) {
                    for (var setName in ctx.definition) {
                        var set = ctx.definition[setName];
                        if (set.elementType === bindingParameter_1.elementType) {
                            set.actions = set.actions || {};
                            set.actions[actionInfo.name] = definition;
                        }
                    }
                });
            }
            else {
                var filteredTypeDefinitions = typeDefinitions.filter(function (d) { return d.typeName === bindingParameter_1.type && d.type === 'entity'; });
                filteredTypeDefinitions.forEach(function (t) {
                    t.definition[actionInfo.name] = definition;
                });
            }
        }
        else {
            delete definition.namespace;
            var methodFullName_1 = ns + '.' + actionInfo.name;
            var filteredContextDefinitions = typeDefinitions.filter(function (d) { return d.type === 'context'; });
            filteredContextDefinitions.forEach(function (ctx) {
                ctx.contextImportMethods.forEach(function (methodImportInfo) {
                    if (methodImportInfo.action === methodFullName_1 || methodImportInfo.function === methodFullName_1) {
                        ctx.definition[actionInfo.name] = definition;
                    }
                });
            });
        }
    };
    Metadata.prototype.processMetadata = function (createdTypes) {
        var _this = this;
        var types = createdTypes || [];
        var typeDefinitions = [];
        var serviceMethods = [];
        containsField(this.metadata, "references", function (references) {
            references.forEach(function (ref) {
                containsField(ref, "includes", function (includes) {
                    includes.forEach(function (include) {
                        _this.annotationHandler.addInclude(include);
                    });
                });
            });
        });
        var dtsModules = {};
        types.dts = '/*//////////////////////////////////////////////////////////////////////////////////////\n' +
            '//////     Autogenerated by JaySvcUtil http://JayData.org for more info        /////////\n' +
            '//////                      OData  V4  TypeScript                              /////////\n' +
            '//////////////////////////////////////////////////////////////////////////////////////*/\n\n';
        types.dts += dts_1.JayData.src + '\n\n';
        //types.dts += 'declare module Edm {\n' + Object.keys(dtsTypeMapping).map(t => '    type ' + t.split('.')[1] + ' = ' + dtsTypeMapping[t] + ';').join('\n') + '\n}\n\n';
        var self = this;
        this.metadata.dataServices.schemas.forEach(function (schema) {
            var ns = schema.namespace;
            dtsModules[ns] = ['declare module ' + ns + ' {', '}'];
            if (schema.enumTypes) {
                var enumTypes = schema.enumTypes.map(function (ct) { return _this.createEnumType(ct, ns); });
                typeDefinitions.push.apply(typeDefinitions, enumTypes);
            }
            if (schema.complexTypes) {
                var complexTypes = schema.complexTypes.map(function (ct) { return _this.createEntityType(ct, ns); });
                typeDefinitions.push.apply(typeDefinitions, complexTypes);
            }
            if (schema.entityTypes) {
                var entityTypes = schema.entityTypes.map(function (et) { return _this.createEntityType(et, ns); });
                typeDefinitions.push.apply(typeDefinitions, entityTypes);
            }
            if (schema.actions) {
                serviceMethods.push.apply(serviceMethods, schema.actions.map(function (m) { return function (defs) { return _this.applyBoundMethod(m, ns, defs, '$data.ServiceAction'); }; }));
            }
            if (schema.functions) {
                serviceMethods.push.apply(serviceMethods, schema.functions.map(function (m) { return function (defs) { return _this.applyBoundMethod(m, ns, defs, '$data.ServiceFunction'); }; }));
            }
            if (schema.entityContainer) {
                var contexts = schema.entityContainer.map(function (ctx) { return _this.createContextType(ctx, self.options.namespace || ns); });
                typeDefinitions.push.apply(typeDefinitions, contexts);
            }
            //console.log('annotations', schema)
            containsField(schema, 'annotations', function (annotations) {
                annotations.forEach(function (annot) {
                    containsField(annot, "target", function (target) {
                        containsField(annot, "annotations", function (v) {
                            _this.annotationHandler.processSchemaAnnotations(target, v, annot.qualifier);
                        });
                    });
                });
            });
        });
        serviceMethods.forEach(function (m) { return m(typeDefinitions); });
        var contextFullName;
        types.src = '(function(mod) {\n' +
            '  if (typeof exports == "object" && typeof module == "object") return mod(exports, require("jaydata/core")); // CommonJS\n' +
            '  if (typeof define == "function" && define.amd) return define(["exports", "jaydata/core"], mod); // AMD\n' +
            '  mod($data.generatedContext || ($data.generatedContext = {}), $data); // Plain browser env\n' +
            '})(function(exports, $data) {\n\n' +
            'exports.$data = $data;\n\n' +
            'var types = {};\n\n';
        typeDefinitions = this.orderTypeDefinitions(typeDefinitions);
        types.push.apply(types, typeDefinitions.map(function (d) {
            _this.annotationHandler.preProcessAnnotation(d);
            _this.storeExportable(d.params[0]);
            var dtsm = dtsModules[d.namespace];
            if (!dtsm) {
                dtsm = dtsModules[d.namespace] = ['declare module ' + d.namespace + ' {', '}'];
            }
            var dtsPart = [];
            var srcPart = '';
            if (d.baseType == '$data.Enum') {
                dtsPart.push('    export enum ' + d.typeName.split('.').pop() + ' {');
                if (d.params[3] && Object.keys(d.params[3]).length > 0) {
                    Object.keys(d.params[3]).forEach(function (dp) { return dtsPart.push('        ' + d.params[3][dp].name + ','); });
                }
                srcPart += 'types["' + d.params[0] + '"] = $data.createEnum("' + d.params[0] + '", [\n' +
                    Object.keys(d.params[3]).map(function (dp) { return '  ' + _this._createPropertyDefString(d.params[3][dp]); }).join(',\n') +
                    '\n]);\n\n';
            }
            else {
                dtsPart.push('    export class ' + d.typeName.split('.').pop() + ' extends ' + d.baseType + ' {');
                if (d.baseType == self.options.contextType) {
                    dtsPart.push('        onReady(): Promise<' + d.typeName.split('.').pop() + '>;');
                    dtsPart.push('');
                }
                else {
                    dtsPart.push('        constructor();');
                    var ctr = '        constructor(initData: { ';
                    if (d.params[2] && Object.keys(d.params[2]).length > 0) {
                        ctr += Object.keys(d.params[2]).map(function (dp) { return dp + '?: ' + (d.params[2][dp].type == 'Array' ? d.params[2][dp].elementType + '[]' : d.params[2][dp].type); }).join('; ');
                    }
                    ctr += ' });';
                    dtsPart.push(ctr);
                    dtsPart.push('');
                }
                var typeName = d.baseType;
                if (d.baseType == _this.options.contextType) {
                    srcPart += 'exports.type = ';
                    contextFullName = d.typeName;
                }
                srcPart += 'types["' + d.params[0] + '"] = ' +
                    (typeName == _this.options.baseType || typeName == _this.options.contextType ? ('$data("' + typeName + '")') : 'types["' + typeName + '"]') +
                    '.extend("' + d.params[0] + '", ';
                if (d.params[2] && Object.keys(d.params[2]).length > 0) {
                    srcPart += '{\n' + Object.keys(d.params[2]).map(function (dp) { return '  ' + dp + ': ' + _this._createPropertyDefString(d.params[2][dp]); }).join(',\n') + '\n}';
                    if (d.baseType == _this.options.contextType) {
                        Object.keys(d.params[2]).forEach(function (dp) { return dtsPart.push('        ' + dp + ': ' + _this._typeToTS(d.params[2][dp].type, d.params[2][dp].elementType, d.params[2][dp]) + ';'); });
                    }
                    else {
                        Object.keys(d.params[2]).forEach(function (dp) { return dtsPart.push('        ' + dp + ': ' + _this._typeToTS(d.params[2][dp].type, d.params[2][dp].elementType, d.params[2][dp]) + ';'); });
                    }
                }
                else
                    srcPart += 'null';
                if (d.params[3] && Object.keys(d.params[3]).length > 0) {
                    srcPart += ', {\n' + Object.keys(d.params[3]).map(function (dp) { return '  ' + dp + ': ' + _this._createPropertyDefString(d.params[3][dp]); }).join(',\n') + '\n}';
                }
                srcPart += ');\n\n';
            }
            types.src += srcPart;
            dtsPart.push('    }');
            dtsm.splice(1, 0, dtsPart.join('\n'));
            if (_this.options.debug)
                console.log('Type generated:', d.params[0]);
            if (_this.options.generateTypes !== false) {
                var baseType = _this.options.container.resolveType(d.baseType);
                var type = baseType.extend.apply(baseType, d.params);
                _this.annotationHandler.addAnnotation(type);
                return type;
            }
        }));
        this.addExportables(types);
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
        types.src += this.annotationHandler.annotationsText();
        types.src += '});';
        // declare modules
        types.dts += Object.keys(dtsModules)
            .filter(function (m) { return dtsModules[m] && dtsModules[m].length > 2; })
            .map(function (m) { return dtsModules[m].join('\n\n'); })
            .join('\n\n');
        // export modules
        types.dts += Object.keys(dtsModules)
            .filter(function (m) { return dtsModules[m] && dtsModules[m].length > 2; })
            .map(function (m) { return m.split(".")[0]; })
            .filter(function (v, i, a) { return a.indexOf(v) === i; }) // distinct
            .map(function (m) { return '\n\nexport {' + m + ' as ' + m + '}'; })
            .join('');
        if (contextFullName) {
            var mod = ['\n\nexport var type: typeof ' + contextFullName + ';',
                'export var factory: (config:any) => ' + contextFullName + ';'];
            if (this.options.autoCreateContext) {
                var contextName = typeof this.options.autoCreateContext == 'string' ? this.options.autoCreateContext : 'context';
                mod.push('export var ' + contextName + ': ' + contextFullName + ';');
            }
            types.dts += mod.join('\n');
        }
        if (this.options.generateTypes === false) {
            types.length = 0;
        }
        return types;
    };
    Metadata.prototype._createPropertyDefString = function (definition) {
        if (definition.concurrencyMode) {
            return JSON.stringify(definition).replace('"concurrencyMode":"fixed"}', '"concurrencyMode":$data.ConcurrencyMode.Fixed}');
        }
        else {
            return JSON.stringify(definition);
        }
    };
    Metadata.prototype._typeToTS = function (type, elementType, definition) {
        var _this = this;
        if (type == this.options.entitySetType) {
            return '$data.EntitySet<typeof ' + elementType + ', ' + elementType + '>';
        }
        else if (type == '$data.Queryable') {
            return '$data.Queryable<' + elementType + '>';
        }
        else if (type == this.options.collectionBaseType) {
            return elementType + '[]';
        }
        else if (type == '$data.ServiceAction') {
            return '{ (' + (definition.params.length > 0 ? definition.params.map(function (p) { return p.name + ': ' + _this._typeToTS(p.type, p.elementType, p); }).join(', ') : '') + '): Promise<void>; }';
        }
        else if (type == '$data.ServiceFunction') {
            var t = this._typeToTS(definition.returnType, definition.elementType, definition);
            if (t.indexOf('$data.Queryable') < 0)
                t = 'Promise<' + t + '>';
            return '{ (' + (definition.params.length > 0 ? definition.params.map(function (p) { return p.name + ': ' + _this._typeToTS(p.type, p.elementType, p); }).join(', ') : '') + '): ' + t + '; }';
        }
        else
            return type;
    };
    Metadata.prototype.orderTypeDefinitions = function (typeDefinitions) {
        var contextTypes = typeDefinitions.filter(function (t) { return t.type === 'context'; });
        var ordered = [];
        var dependants = [].concat(typeDefinitions.filter(function (t) { return t.type !== 'context'; }));
        var addedTypes;
        var baseType = this.options.baseType;
        var dependantCount = Number.MAX_VALUE;
        while (dependants.length) {
            var dependantItems = [].concat(dependants);
            dependants.length = 0;
            dependantItems.forEach(function (typeDef) {
                if (dependantCount === dependantItems.length ||
                    typeDef.type !== "entity" ||
                    typeDef.baseType === baseType ||
                    ordered.some(function (t) { return t.typeName === typeDef.baseType; })) {
                    ordered.push(typeDef);
                }
                else {
                    dependants.push(typeDef);
                }
            });
            dependantCount = dependantItems.length;
        }
        return ordered.concat(contextTypes);
    };
    Metadata.prototype.storeExportable = function (typesStr) {
        var typesArr = typesStr.split(".");
        var container = this.storedTypes;
        typesArr.forEach(function (current) {
            if (typesArr[typesArr.length - 1] === current) {
                container[current] = "@@" + typesStr + "@@";
            }
            else {
                if (!container[current]) {
                    container[current] = {};
                }
                container = container[current];
            }
        });
    };
    Metadata.prototype.addExportables = function (meta) {
        for (var key in this.storedTypes) {
            var types = "exports." + key + " = " +
                JSON.stringify(this.storedTypes[key], null, 2)
                    .replace(/"@@/g, "types[\"")
                    .replace(/@@"/g, "\"]") + ";\n\n";
            meta.src += types;
        }
    };
    return Metadata;
}());
exports.Metadata = Metadata;
//# sourceMappingURL=metadata.js.map