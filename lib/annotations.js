"use strict";
var Annotations = (function () {
    function Annotations() {
        this.includes = [];
        this.annotations = [];
        this.processedAnnotations = {
            "Org.OData.Core.V1.Computed": function (annotationInfo, typeDef) {
                if (typeDef.definition && annotationInfo.property && typeDef.definition[annotationInfo.property]) {
                    var propDef = typeDef.definition[annotationInfo.property];
                    if (annotationInfo.annotation.bool === 'true') {
                        if (propDef.required) {
                            delete propDef.required;
                        }
                        propDef.computed = true;
                    }
                }
            },
            "Org.OData.Core.V1.OptimisticConcurrency": function (annotationInfo, typeDef) {
                if (typeDef.definition && Array.isArray(annotationInfo.annotation.propertyPaths)) {
                    annotationInfo.annotation.propertyPaths.forEach(function (property) {
                        var propDef = typeDef.definition[property];
                        if (propDef) {
                            propDef.concurrencyMode = 'fixed';
                        }
                    });
                }
            }
        };
    }
    Annotations.prototype.addInclude = function (include) {
        this.includes.push(include);
    };
    Annotations.prototype.processEntityPropertyAnnotations = function (typeName, property, annotations, isStatic) {
        var _this = this;
        if (isStatic === void 0) { isStatic = false; }
        annotations.forEach(function (annot) {
            _this.annotations.push({
                typeName: typeName,
                property: property,
                annotation: annot,
                isStatic: isStatic
            });
        });
    };
    Annotations.prototype.processEntityAnnotations = function (typeName, annotations, isStatic) {
        if (isStatic === void 0) { isStatic = false; }
        return this.processEntitySetAnnotations(typeName, annotations, isStatic);
    };
    Annotations.prototype.processEntitySetAnnotations = function (typeName, annotations, isStatic) {
        var _this = this;
        if (isStatic === void 0) { isStatic = false; }
        annotations.forEach(function (annot) {
            var property = annot.path;
            _this.annotations.push({
                typeName: typeName,
                property: property,
                annotation: annot,
                isStatic: isStatic
            });
        });
    };
    Annotations.prototype.processSchemaAnnotations = function (target, annotations, qualifier, isStatic) {
        var _this = this;
        if (isStatic === void 0) { isStatic = false; }
        annotations.forEach(function (annot) {
            var targetParts = target.split('/');
            var fullTypeName = targetParts[0];
            var property = targetParts[1];
            _this.annotations.push({
                typeName: fullTypeName,
                property: property,
                annotation: annot,
                qualifier: qualifier,
                isStatic: isStatic
            });
        });
    };
    Annotations.prototype.preProcessAnnotation = function (typeDef) {
        var _this = this;
        this.annotations.forEach(function (annotationInfo) {
            if (annotationInfo.typeName !== typeDef.typeName)
                return;
            var property = annotationInfo.property;
            var annotation = annotationInfo.annotation;
            var metadataKey = _this.resolveAnnotationTypeAlias(annotation.term);
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey;
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey;
            }
            if (typeof _this.processedAnnotations[metadataKey] === 'function') {
                _this.processedAnnotations[metadataKey](annotationInfo, typeDef);
            }
        });
    };
    Annotations.prototype.addAnnotation = function (type) {
        var _this = this;
        this.annotations.forEach(function (annotationInfo) {
            if (type.fullName !== annotationInfo.typeName)
                return;
            var property = annotationInfo.property;
            var annotation = annotationInfo.annotation;
            var value = undefined;
            var valueResolverFuncName = 'value' + annotation.annotationType;
            if (valueResolverFuncName in _this && typeof _this[valueResolverFuncName] === 'function') {
                value = _this[valueResolverFuncName](annotation);
            }
            var metadataKey = _this.resolveAnnotationTypeAlias(annotation.term);
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey;
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey;
            }
            if (typeof Reflect !== 'undefined' && typeof Reflect.defineMetadata === 'function') {
                if (property) {
                    Reflect.defineMetadata(metadataKey, value, annotationInfo.isStatic ? type : type.prototype, property);
                }
                else {
                    Reflect.defineMetadata(metadataKey, value, annotationInfo.isStatic ? type : type.prototype);
                }
            }
        });
    };
    Annotations.prototype.annotationsText = function () {
        var _this = this;
        var src = 'if (typeof Reflect !== "undefined" && typeof Reflect.defineMetadata === "function") {\n';
        this.annotations.forEach(function (annotationInfo) {
            var property = annotationInfo.property;
            var annotation = annotationInfo.annotation;
            var value = undefined;
            var valueResolverFuncName = 'value' + annotation.annotationType;
            if (valueResolverFuncName in _this && typeof _this[valueResolverFuncName] === 'function') {
                value = _this[valueResolverFuncName](annotation);
            }
            var metadataKey = _this.resolveAnnotationTypeAlias(annotation.term);
            if (annotation.qualifier) {
                metadataKey = annotation.qualifier + ':' + metadataKey;
            }
            if (annotationInfo.qualifier) {
                metadataKey = annotationInfo.qualifier + ':' + metadataKey;
            }
            var type = 'types["' + annotationInfo.typeName + '"]' + (annotationInfo.isStatic ? '' : '.prototype');
            if (property) {
                src += '  Reflect.defineMetadata("' + metadataKey + '", ' + JSON.stringify(value) + ', ' + type + ', "' + property + '")\n';
            }
            else {
                src += '  Reflect.defineMetadata("' + metadataKey + '", ' + JSON.stringify(value) + ', ' + type + ')\n';
            }
        });
        src += '}\n\n';
        return src;
    };
    Annotations.prototype.resolveAnnotationTypeAlias = function (term) {
        for (var i = 0; i < this.includes.length; i++) {
            var include = this.includes[i];
            if (term.indexOf(include['alias'] + '.') === 0) {
                return include['namespace'] + term.substr(include['alias'].length);
            }
        }
        return term;
    };
    Annotations.prototype.valueUnknown = function (a) {
        return undefined;
    };
    Annotations.prototype.valueBinary = function (a) {
        return a.binary;
    };
    Annotations.prototype.valueBool = function (a) {
        return a.bool;
    };
    Annotations.prototype.valueDate = function (a) {
        return a.date;
    };
    Annotations.prototype.valueDateTimeOffset = function (a) {
        return a.dateTimeOffset;
    };
    Annotations.prototype.valueDecimal = function (a) {
        return a.decimal;
    };
    Annotations.prototype.valueDuration = function (a) {
        return a.duration;
    };
    Annotations.prototype.valueEnumMember = function (a) {
        return a.enumMember;
    };
    Annotations.prototype.valueFloat = function (a) {
        return a.float;
    };
    Annotations.prototype.valueGuid = function (a) {
        return a.guid;
    };
    Annotations.prototype.valueInt = function (a) {
        return a.int;
    };
    Annotations.prototype.valueString = function (a) {
        return a.string;
    };
    Annotations.prototype.valueTimeOfDay = function (a) {
        return a.timeOfDay;
    };
    Annotations.prototype.valuePropertyPath = function (a) {
        return a.propertyPaths;
    };
    Annotations.prototype.valueNavigationPropertyPath = function (a) {
        return a.navigationPropertyPaths;
    };
    Annotations.prototype.valueAnnotationPath = function (a) {
        return a.annotationPaths;
    };
    Annotations.prototype.valueNull = function (a) {
        return null;
    };
    return Annotations;
}());
exports.Annotations = Annotations;
//# sourceMappingURL=annotations.js.map