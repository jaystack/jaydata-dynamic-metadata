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
    Metadata.prototype.createProperty = function (entitySchema, propertySchema) {
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
        return {
            name: propertySchema.name,
            definition: definition
        };
    };
    Metadata.prototype.createNavigationProperty = function (entitySchema, propertySchema) {
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
        return {
            name: propertySchema.name,
            definition: definition
        };
    };
    Metadata.prototype.createEntityDefinition = function (entitySchema) {
        var props = (entitySchema.properties || []).map(this.createProperty.bind(this, entitySchema));
        var navigationProps = (entitySchema.navigationProperties || []).map(this.createNavigationProperty.bind(this, entitySchema));
        props = props.concat(navigationProps);
        var result = props.reduce(function (p, c) {
            p[c.name] = c.definition;
            return p;
        }, {});
        return result;
    };
    Metadata.prototype.createEntityType = function (entitySchema, namespace) {
        var baseType = (entitySchema.baseType ? entitySchema.baseType : this.options.baseType);
        var definition = this.createEntityDefinition(entitySchema);
        var entityFullName = namespace + "." + entitySchema.name;
        var staticDefinition = {};
        containsField(entitySchema, "openType", function (v) {
            if (parsebool(v, false)) {
                staticDefinition.openType = { value: true };
            }
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
    Metadata.prototype.createEnumOption = function (entitySchema, propertySchema, i) {
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
        return definition;
    };
    Metadata.prototype.createEnumDefinition = function (enumSchema) {
        var props = (enumSchema.members || []).map(this.createEnumOption.bind(this, enumSchema));
        return props;
    };
    Metadata.prototype.createEnumType = function (enumSchema, namespace) {
        var self = this;
        var definition = this.createEnumDefinition(enumSchema);
        var enumFullName = namespace + "." + enumSchema.name;
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
        //var c = this.options.container
        var t = entitySetSchema.entityType; //c.classTypes[c.classNames[entitySetSchema.entityType]] // || entitySetSchema.entityType
        var prop = {
            name: entitySetSchema.name,
            definition: {
                type: this.options.entitySetType,
                elementType: t
            }
        };
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
            var bindingParameter = definition.params.shift();
            if (bindingParameter.type === this.options.collectionBaseType) {
                var filteredContextDefinitions = typeDefinitions.filter(function (d) { return d.namespace === ns && d.type === 'context'; });
                filteredContextDefinitions.forEach(function (ctx) {
                    for (var setName in ctx.definition) {
                        var set = ctx.definition[setName];
                        if (set.elementType === bindingParameter.elementType) {
                            set.actions = set.actions || {};
                            set.actions[actionInfo.name] = definition;
                        }
                    }
                });
            }
            else {
                var filteredTypeDefinitions = typeDefinitions.filter(function (d) { return d.typeName === bindingParameter.type && d.type === 'entity'; });
                filteredTypeDefinitions.forEach(function (t) {
                    t.definition[actionInfo.name] = definition;
                });
            }
        }
        else {
            delete definition.namespace;
            var methodFullName = ns + '.' + actionInfo.name;
            var filteredContextDefinitions = typeDefinitions.filter(function (d) { return d.type === 'context'; });
            filteredContextDefinitions.forEach(function (ctx) {
                ctx.contextImportMethods.forEach(function (methodImportInfo) {
                    if (methodImportInfo.action === methodFullName || methodImportInfo.function === methodFullName) {
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
        var self = this;
        this.metadata.dataServices.schemas.forEach(function (schema) {
            var ns = schema.namespace;
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
        });
        serviceMethods.forEach(function (m) { return m(typeDefinitions); });
        types.src = '(function(mod) {\n' +
            '  if (typeof exports == "object" && typeof module == "object") return mod(exports, require("jaydata/core")); // CommonJS\n' +
            '  if (typeof define == "function" && define.amd) return define(["exports"], mod); // AMD\n' +
            '  mod($data.generatedContext || ($data.generatedContext = {}), $data); // Plain browser env\n' +
            '})(function(exports, $data) {\n\n' +
            'var types = {};\n\n';
        typeDefinitions = this.orderTypeDefinitions(typeDefinitions);
        types.push.apply(types, typeDefinitions.map(function (d) {
            var srcPart = '';
            if (d.baseType == '$data.Enum') {
                srcPart += 'types["' + d.params[0] + '"] = $data.createEnum("' + d.params[0] + '", [\n' +
                    Object.keys(d.params[3]).map(function (dp) { return '  ' + JSON.stringify(d.params[3][dp]); }).join(',\n') +
                    '\n]);\n\n';
            }
            else {
                var typeName = d.baseType;
                if (d.baseType == self.options.contextType)
                    srcPart += 'exports.type = ';
                srcPart += 'types["' + d.params[0] + '"] = ' +
                    (typeName == self.options.baseType || typeName == self.options.contextType ? ('$data("' + typeName + '")') : 'types["' + typeName + '"]') +
                    '.extend("' + d.params[0] + '", ';
                if (d.params[2] && Object.keys(d.params[2]).length > 0)
                    srcPart += '{\n' + Object.keys(d.params[2]).map(function (dp) { return '  ' + dp + ': ' + JSON.stringify(d.params[2][dp]); }).join(',\n') + '\n}';
                else
                    srcPart += 'null';
                if (d.params[3] && Object.keys(d.params[3]).length > 0)
                    srcPart += ', {\n' + Object.keys(d.params[3]).map(function (dp) { return '  ' + dp + ': ' + JSON.stringify(d.params[3][dp]); }).join(',\n') + '\n}';
                srcPart += ');\n\n';
            }
            types.src += srcPart;
            if (_this.options.debug)
                console.log('Type generated:', d.params[0]);
            if (_this.options.generateTypes !== false) {
                var baseType = _this.options.container.resolveType(d.baseType);
                return baseType.extend.apply(baseType, d.params);
            }
        }));
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
        types.src += '});';
        if (this.options.generateTypes === false) {
            types.length = 0;
        }
        return types;
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
    return Metadata;
})();
exports.Metadata = Metadata;
//# sourceMappingURL=metadata.js.map