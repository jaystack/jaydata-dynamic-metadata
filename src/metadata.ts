var containsField = (obj, field, cb) => {
    // if (field in (obj || {})) {
    //     cb(obj[field])
    // }
    if (obj && field in obj && typeof obj[field] !== "undefined") {
        cb(obj[field])
    }
}

var parsebool = (b,d) => {
    if ("boolean" === typeof b) {
        return b
    }
    switch(b) {
        case "true": return true
        case "false": return false
        default: return d
    }
}

var _collectionRegex = /^Collection\((.*)\)$/

export class Metadata{
	options:any
	metadata:any
	private $data:any
	constructor($data:any, options:any, metadata:any){
		this.$data = $data;
		this.options = options || {};
        this.metadata = metadata;
        this.options.container = this.$data.Container; //this.options.container || $data.createContainer()
	}

	_getMaxValue(maxValue) {
        if ("number" === typeof maxValue) return maxValue
        if ("max" === maxValue) return Number.MAX_VALUE
        return parseInt(maxValue)
    }

	createTypeDefinition(propertySchema, definition){
        containsField(propertySchema, "type", v => {
            var match = _collectionRegex.exec(v)
            if(match){
                definition.type = this.options.collectionBaseType || 'Array'
                definition.elementType = match[1]
            } else {
                definition.type = v
            }
        })
    }

    createReturnTypeDefinition(propertySchema, definition){
        containsField(propertySchema, "type", v => {
            var match = _collectionRegex.exec(v)
            if(match){
                definition.returnType = '$data.Queryable'
                definition.elementType = match[1]
            } else {
                definition.returnType = v
            }
        })
    }


    createProperty(entitySchema, propertySchema) {
		var self = this;

        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition:any = {}

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

        containsField(propertySchema, "concurrencyMode", v => {
            definition.concurrencyMode = self.$data.ConcurrencyMode[v]
        })

        return {
            name: propertySchema.name,
            definition
        }
    }

    createNavigationProperty(entitySchema, propertySchema) {
        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition:any = {}

        this.createTypeDefinition(propertySchema, definition)

        containsField(propertySchema, "nullable", v => {
            definition.nullable = parsebool(v, true),
            definition.required = parsebool(v, true) === false
        })

        containsField(propertySchema, "partner", p => {
            definition.inverseProperty = p
        })

        if(!definition.inverseProperty) {
            definition.inverseProperty = '$$unbound'
        }

        return {
            name: propertySchema.name,
            definition
        }
    }

    createEntityDefinition(entitySchema) {
        var props = (entitySchema.properties || []).map(this.createProperty.bind(this, entitySchema))
        var navigationProps = (entitySchema.navigationProperties || []).map(this.createNavigationProperty.bind(this, entitySchema))
        props = props.concat(navigationProps)
        var result = props.reduce( (p, c) => {
            p[c.name] = c.definition
            return p
         }, {})
        return result
    }

    createEntityType(entitySchema, namespace) {
        let baseType = (entitySchema.baseType ? entitySchema.baseType : this.options.baseType) || this.$data.Entity
        let definition = this.createEntityDefinition(entitySchema)
        let entityFullName = `${namespace}.${entitySchema.name}`

        let staticDefinition:any = {}

        containsField(entitySchema, "openType", v => {
            if(parsebool(v, false)){
                staticDefinition.openType = { value: true }
            }
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

    createEnumOption(entitySchema, propertySchema, i) {
        if (!propertySchema) {
            propertySchema = entitySchema
            entitySchema = undefined
        }

        var definition:any = {
            name: propertySchema.name,
            index: i
        }

        containsField(propertySchema, "value", value => {
            var v = +value
            if (!isNaN(v)) {
                definition.value = v
            }
        })

        return definition
    }

    createEnumDefinition(enumSchema) {
        var props = (enumSchema.members || []).map(this.createEnumOption.bind(this, enumSchema))
        return props
    }

    createEnumType(enumSchema, namespace) {
		var self = this;
        let definition = this.createEnumDefinition(enumSchema)
        let enumFullName = `${namespace}.${enumSchema.name}`

        return {
            namespace,
            typeName: enumFullName,
            baseType: self.$data.Enum,
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
                type: this.options.entitySetType || '$data.EntitySet',
                elementType: t
            }
        }
        return prop
    }

    indexBy(fieldName, pick) {
        return [(p, c) => { p[c[fieldName]] = c[pick];  return p }, {}]
    }

    createContextDefinition(contextSchema, namespace) {
        var props = (contextSchema.entitySets || []).map( es => this.createEntitySetProperty(es, contextSchema))

        var result = props.reduce(...this.indexBy("name","definition"))
        return result
    }

    createContextType(contextSchema, namespace) {
        if (Array.isArray(contextSchema)) {
            throw new Error("Array type is not supported here")
        }
        var definition = this.createContextDefinition(contextSchema, namespace)
        var baseType = this.options.contextType || this.$data.EntityContext
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

        if(parsebool(actionInfo.isBound, false)) {
            let bindingParameter = definition.params.shift()

            if(bindingParameter.type === (this.options.collectionBaseType || 'Array')){
                let filteredContextDefinitions = typeDefinitions.filter((d) => d.namespace === ns && d.type === 'context')
                filteredContextDefinitions.forEach(ctx => {
                    for(var setName in ctx.definition) {
                        let set = ctx.definition[setName]
                        if(set.elementType === bindingParameter.elementType) {
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
                    if(methodImportInfo.action === methodFullName || methodImportInfo.function === methodFullName){
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

		var self = this;
        this.metadata.dataServices.schemas.forEach(schema => {
            var ns = schema.namespace

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

            if(schema.actions){
                serviceMethods.push(...schema.actions.map(m => defs => this.applyBoundMethod(m, ns, defs, '$data.ServiceAction')))
            }

            if(schema.functions){
                serviceMethods.push(...schema.functions.map(m => defs => this.applyBoundMethod(m, ns, defs, '$data.ServiceFunction')))
            }

            if (schema.entityContainer) {
                let contexts = schema.entityContainer.map(ctx => this.createContextType(ctx, self.options.namespace || ns))
                typeDefinitions.push(...contexts)
            }
        })

        serviceMethods.forEach(m => m(typeDefinitions))

		types.src = '(function(mod) {\n' +
        '  if (typeof exports == "object" && typeof module == "object") return mod(exports, require("jaydata/core")); // CommonJS\n' +
        '  if (typeof define == "function" && define.amd) return define(["exports"], mod); // AMD\n' +
        '  mod($data.generatedContext || ($data.generatedContext = {}), $data); // Plain browser env\n' +
        '})(function(exports, $data) {\n\n' +
		'var types = {};\n\n';
        types.push(...typeDefinitions.map((d) => {

            var srcPart = '';
            if (d.baseType == self.$data.Enum){
                srcPart += 'types["' + d.params[0] + '"] = $data.createEnum("' + d.params[0] + '", [\n' +
                Object.keys(d.params[3]).map(dp => '  ' + JSON.stringify(d.params[3][dp])).join(',\n') +
                '\n]);\n\n';
            }else{
				var typeName = this.options.container.resolveName(d.baseType);
                if (d.baseType == self.$data.EntityContext) srcPart += 'exports.type = ';
				srcPart += 'types["' + d.params[0] + '"] = ' +
					(typeName == '$data.Entity' || typeName == '$data.EntityContext' ? typeName : 'types["' + typeName + '"]') +
					'.extend("' + d.params[0] + '", ';
				if (d.params[2] && Object.keys(d.params[2]).length > 0) srcPart += '{\n' + Object.keys(d.params[2]).map(dp => '  ' + dp + ': '+ JSON.stringify(d.params[2][dp])).join(',\n') + '\n}';
                else srcPart += 'null';
                if (d.params[3] && Object.keys(d.params[3]).length > 0) srcPart += ', {\n' + Object.keys(d.params[3]).map(dp => '  ' + dp + ': '+ JSON.stringify(d.params[3][dp])).join(',\n') + '\n}';
				srcPart += ');\n\n';
            }
			types.src += srcPart;

			if (this.options.debug) console.log('Type generated:', d.params[0]);
            var baseType = this.options.container.resolveType(d.baseType)
            return baseType.extend.apply(baseType, d.params)
        }));
		types.src += 'var ctxType = exports.type;\n' +
        'exports.factory = function(config){\n' +
        '  if (ctxType){\n' +
        '    var cfg = $data.typeSystem.extend({\n' +
        '      name: "oData",\n' +
        '      oDataServiceHost: "' + this.options.url.replace('/$metadata', '') + '",\n' +
        '      withCredentials: ' + (this.options.withCredentials || false) + ',\n' +
        '      maxDataServiceVersion: "' + (this.options.maxDataServiceVersion || '4.0') + '"\n' +
        '    }, config);\n' +
        '    return new ctxType(cfg);\n' +
        '  }else{\n' +
        '    return null;\n' +
        '  }\n' +
        '};\n\n';

		if (this.options.autoCreateContext){
			var contextName = typeof this.options.autoCreateContext == 'string' ? this.options.autoCreateContext : 'context';
			types.src += 'exports["' + contextName + '"] = exports.factory();\n\n';
		}

        types.src += '});';

        return types;
    }
}
