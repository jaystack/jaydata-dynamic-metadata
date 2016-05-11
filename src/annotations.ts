export class Annotations {
    private includes: Array<any> = []
    private annotations: Array<any> = []

    addInclude(include) {
        this.includes.push(include)
    }

    processEntityPropertyAnnotations(typeName, property, annotations, isStatic = false) {
        annotations.forEach((annot) => {
            this.annotations.push({
                typeName: typeName,
                property: property,
                annotation: annot,
                isStatic: isStatic
            })
        })
    }

    processEntityAnnotations(typeName, annotations, isStatic = false) {
        return this.processEntitySetAnnotations(typeName, annotations, isStatic)
    }

    processEntitySetAnnotations(typeName, annotations, isStatic = false) {
        annotations.forEach((annot) => {
            let property = annot.path

            this.annotations.push({
                typeName: typeName,
                property: property,
                annotation: annot,
                isStatic: isStatic
            })
        })
    }

    processSchemaAnnotations(target, annotations, qualifier, isStatic = false) {
        annotations.forEach((annot) => {
            let targetParts = target.split('/')
            let fullTypeName = targetParts[0]
            let property = targetParts[1]

            this.annotations.push({
                typeName: fullTypeName,
                property: property,
                annotation: annot,
                qualifier: qualifier,
                isStatic: isStatic
            })
        })
    }

    preProcessAnnotation(typeDef) {
        this.annotations.forEach(annotationInfo => {
            if (annotationInfo.typeName !== typeDef.typeName) return

            let property = annotationInfo.property
            let annotation = annotationInfo.annotation

            let metadataKey = this.resolveAnnotationTypeAlias(annotation.term)
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey
            }

            if (typeof this.processedAnnotations[metadataKey] === 'function') {
                this.processedAnnotations[metadataKey](annotationInfo, typeDef);
            }
        })
    }

    processedAnnotations: Object = {
        "Org.OData.Core.V1.Computed": function(annotationInfo, typeDef) {
            if (typeDef.definition && annotationInfo.property && typeDef.definition[annotationInfo.property]) {
                var propDef = typeDef.definition[annotationInfo.property]
                if (annotationInfo.annotation.bool === 'true') {
                    if (propDef.required) {
                        delete propDef.required
                    }
                    propDef.computed = true;
                }
            }
        },
        "Org.OData.Core.V1.OptimisticConcurrency": function(annotationInfo, typeDef) {
            if (typeDef.definition && Array.isArray(annotationInfo.annotation.propertyPaths)) {
                annotationInfo.annotation.propertyPaths.forEach(property => {
                    var propDef = typeDef.definition[property]
                    if (propDef) {
                        propDef.concurrencyMode = 'fixed'
                    }
                })
            }
        }
    }

    addAnnotation(type) {
        this.annotations.forEach(annotationInfo => {
            if (type.fullName !== annotationInfo.typeName) return

            let property = annotationInfo.property
            let annotation = annotationInfo.annotation

            let value = undefined;
            let valueResolverFuncName = 'value' + annotation.annotationType

            if (valueResolverFuncName in this && typeof this[valueResolverFuncName] === 'function') {
                value = this[valueResolverFuncName](annotation)
            }

            let metadataKey = this.resolveAnnotationTypeAlias(annotation.term)
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey
            }

            if (typeof Reflect !== 'undefined' && typeof Reflect.defineMetadata === 'function') {
                if (property) {
                    Reflect.defineMetadata(metadataKey, value, annotationInfo.isStatic ? type : type.prototype, property)
                } else {
                    Reflect.defineMetadata(metadataKey, value, annotationInfo.isStatic ? type : type.prototype)
                }
            }
        })
    }

    annotationsText() {
        var src = 'if (typeof Reflect !== "undefined" && typeof Reflect.defineMetadata === "function") {\n'

        this.annotations.forEach(annotationInfo => {
            let property = annotationInfo.property
            let annotation = annotationInfo.annotation

            let value = undefined;
            let valueResolverFuncName = 'value' + annotation.annotationType

            if (valueResolverFuncName in this && typeof this[valueResolverFuncName] === 'function') {
                value = this[valueResolverFuncName](annotation)
            }

            let metadataKey = this.resolveAnnotationTypeAlias(annotation.term)
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey
            }

            var type = 'types["' + annotationInfo.typeName + '"]' + (annotationInfo.isStatic ? '' : '.prototype')
            if (property) {
                src += '  Reflect.defineMetadata("' + metadataKey + '", ' + JSON.stringify(value) + ', ' + type + ', "' + property + '")\n'
            } else {
                src += '  Reflect.defineMetadata("' + metadataKey + '", ' + JSON.stringify(value) + ', ' + type + ')\n'
            }

        })

        src += '}\n\n'
        return src;
    }

    resolveAnnotationTypeAlias(term) {
        for (var i = 0; i < this.includes.length; i++) {
            var include = this.includes[i];

            if (term.indexOf(include['alias'] + '.') === 0) {
                return include['namespace'] + term.substr(include['alias'].length)
            }
        }

        return term
    }

    valueUnknown(a) {
        return undefined
    }

    valueBinary(a) {
        return a.binary
    }

    valueBool(a) {
        return a.bool
    }

    valueDate(a) {
        return a.date
    }

    valueDateTimeOffset(a) {
        return a.dateTimeOffset
    }

    valueDecimal(a) {
        return a.decimal
    }

    valueDuration(a) {
        return a.duration
    }

    valueEnumMember(a) {
        return a.enumMember
    }

    valueFloat(a) {
        return a.float
    }

    valueGuid(a) {
        return a.guid
    }

    valueInt(a) {
        return a.int
    }

    valueString(a) {
        return a.string
    }

    valueTimeOfDay(a) {
        return a.timeOfDay
    }

    valuePropertyPath(a) {
        return a.propertyPaths
    }

    valueNavigationPropertyPath(a) {
        return a.navigationPropertyPaths
    }

    valueAnnotationPath(a) {
        return a.annotationPaths
    }

    valueNull(a) {
        return null
    }
}