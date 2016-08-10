/// <reference path="../lib/metadata.d.ts" />

var Edm = require('odata-v4-metadata').Edm
var Metadata = require('../lib/metadata.js').Metadata
var expect = require('chai').expect
var $data = require('jaydata/core')
require('reflect-metadata')

var options = {
    // url,
    // user,
    // password,
    // withCredentials,
    // maxDataServiceVersion,

    // container,
    // collectionBaseType,
    // baseType,
    // entitySetType,
    // contextType,
    // autoCreateContext
    generateTypes: false
}


describe("model build tests", () => {
    var types = []
    before(() => {
        var schema = require('./simpleSchema.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {}, edmMetadata);
        types = metadata.processMetadata();
    })

    it("default settings", () => {
        expect(typeof types.src).to.equal("string")
        expect(types.src).to.equal(require('./simpleSchemaModel.json').src)
    });

    describe("entity container", () => {
        it("entity container", () => {
            var container = types[2];

            expect(types).to.have.length(3)
            expect(container.fullName).to.equals('Default.Container')
            expect(container.baseTypes).to.have.length(3)
            expect(container.baseTypes[2].fullName).to.equals('$data.EntityContext')
        });


        it("entity set", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('Articles')
            var elementType = types[0];

            expect(def.name).to.equals('Articles')
            expect(def.type).to.equal($data.EntitySet)
            expect(def.originalType).to.equal('$data.EntitySet')
            expect(def.elementType).to.equal(elementType)
        });
    })

    describe("entity types", () => {

        it("entity type", () => {
            var type = types[0];

            expect(types).to.have.length(3)
            expect(type.fullName).to.equals('JayData.Test.CommonItems.Entities.Article')
            expect(type.baseTypes).to.have.length(3)
            expect(type.baseTypes[2].fullName).to.equals('$data.Entity')
        });

        it("entity property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Body')

            expect(def.name).to.equals('Body')
            expect(def.type).to.equal($data.String)
            expect(def.originalType).to.equal('Edm.String')
        });

        it("entity key property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Id')

            expect(def.name).to.equals('Id')
            expect(def.type).to.equal($data.Integer)
            expect(def.originalType).to.equal('Edm.Int32')
            expect(def.key).to.be.true
        });

        it("entity not key property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Body')

            expect(def.name).to.equals('Body')
            expect(def.key).to.be.undefined
        });

        it("entity required property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Lead')

            expect(def.name).to.equals('Lead')
            expect(def.type).to.equal($data.String)
            expect(def.originalType).to.equal('Edm.String')
            expect(def.required).to.be.true
        });

        it("entity not required property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Body')

            expect(def.name).to.equals('Body')
            expect(def.required).to.be.undefined
        });

        it("entity not nullable property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Lead')

            expect(def.name).to.equals('Lead')
            expect(def.type).to.equal($data.String)
            expect(def.originalType).to.equal('Edm.String')
            expect(def.nullable).to.be.false
        });

        it("entity nullable property", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var def = type.getMemberDefinition('Body')

            expect(def.name).to.equals('Body')
            expect(def.nullable).to.be.undefined
        });

        it("entity navigation property - single side", () => {
            expect(types).to.have.length(3)

            var type = types[0];
            var navPropertyType = types[1];
            var def = type.getMemberDefinition('Category')

            expect(def.name).to.equals('Category')
            expect(def.type).to.equal(navPropertyType)
            expect(def.originalType).to.equal(navPropertyType.fullName)
            expect(def.inverseProperty).to.equal("Articles")
        });

        it("entity navigation property - many side", () => {
            expect(types).to.have.length(3)

            var type = types[1];
            var navPropertyType = types[0];
            var def = type.getMemberDefinition('Articles')

            expect(def.name).to.equals('Articles')
            expect(def.type).to.equal($data.Array)
            expect(def.originalType).to.equal('Array')
            expect(def.elementType).to.equal(navPropertyType)
            expect(def.inverseProperty).to.equal("Category")
        });
    })

    describe("methods", () => {

        it("service method primitive result", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SAction1')

            expect(def.method.returnType).to.equals('Edm.String')
            expect(def.method.elementType).to.be.undefined
        });

        it("service method collection primitive result", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SFunction1')

            expect(def.method.returnType).to.equals('$data.Queryable')
            expect(def.method.elementType).to.equals('Edm.String')
        });

        it("service method entity result", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SFunction2')

            expect(def.method.returnType).to.equals('JayData.Test.CommonItems.Entities.Article')
            expect(def.method.elementType).to.be.undefined
        });

        it("service method collection entity result", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SAction2')

            expect(def.method.returnType).to.equals('$data.Queryable')
            expect(def.method.elementType).to.equals('JayData.Test.CommonItems.Entities.Article')
        });

        it("service method Action", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SAction1')

            expect(def.name).to.equals('SAction1')
            expect(def.method.type).to.equal('$data.ServiceAction')
            expect(def.method.method).to.equal('POST')
            expect(def.method.params).to.deep.equal([{ name: 'number', type: 'Edm.Int32' }])
            expect(def.method.serviceName).to.equals('SAction1')
            expect(def.method.returnType).to.equals('Edm.String')
            expect(def.method.elementType).to.be.undefined
            expect(def.method.namespace).to.be.undefined
        });

        it("service method Function", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('SFunction1')

            expect(def.name).to.equals('SFunction1')
            expect(def.method.type).to.equal('$data.ServiceFunction')
            expect(def.method.method).to.equal('GET')
            expect(def.method.params).to.deep.equal([{ name: 'number', type: 'Edm.Int32' }])
            expect(def.method.serviceName).to.equals('SFunction1')
            expect(def.method.returnType).to.equals('$data.Queryable')
            expect(def.method.elementType).to.equals('Edm.String')
            expect(def.method.namespace).to.be.undefined
        });

        it("collection method Action", () => {
            expect(types).to.have.length(3)

            var container = types[2];
            var def = container.getMemberDefinition('Categories')
            var action = def.actions['SAction1']

            expect(action.type).to.equal('$data.ServiceAction')
            expect(action.params).to.deep.equal([
                { name: 'p1', type: 'Edm.Int32' },
                { name: 'p2', type: 'Edm.String' },
                { name: 'p3', type: 'Array', elementType: 'Edm.String' }
            ])
            expect(action.namespace).to.equals('Default')
            expect(action.returnType).to.equals('$data.Queryable')
            expect(action.elementType).to.equals('Edm.String')
        });

        it("entity method Function", () => {
            expect(types).to.have.length(3)

            var container = types[1];
            var def = container.getMemberDefinition('LocationSwipe')

            expect(def.name).to.equals('LocationSwipe')
            expect(def.method.type).to.equal('$data.ServiceFunction')
            expect(def.method.method).to.equal('GET')
            expect(def.method.params).to.deep.equal([{ name: 'Loc', type: 'Edm.GeographyPoint' }])
            expect(def.method.serviceName).to.equals('LocationSwipe')
            expect(def.method.returnType).to.equals('Edm.GeographyPoint')
            expect(def.method.elementType).to.be.undefined
            expect(def.method.namespace).to.equal('Default')
        });
    })
})

describe("options", () => {

    it("custom entity base", () => {
        $data.Entity.extend('ns.test.base.myEntity')

        var schema = require('./simpleSchema.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {
            baseType: 'ns.test.base.myEntity'
        }, edmMetadata);
        var types = metadata.processMetadata();

        expect(types).to.have.length(3)

        var type = types[0]
        expect(type.fullName).to.equals('JayData.Test.CommonItems.Entities.Article')
        expect(type.baseTypes).to.have.length(4)
        expect(type.baseTypes[2].fullName).to.equals('$data.Entity')
        expect(type.baseTypes[3].fullName).to.equals('ns.test.base.myEntity')

        type = types[1]
        expect(type.fullName).to.equals('JayData.Test.CommonItems.Entities.Category')
        expect(type.baseTypes).to.have.length(4)
        expect(type.baseTypes[2].fullName).to.equals('$data.Entity')
        expect(type.baseTypes[3].fullName).to.equals('ns.test.base.myEntity')
    });

    it("custom entity container", () => {
        $data.EntityContext.extend('ns.test.base.myEntityContext')

        var schema = require('./simpleSchema.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {
            contextType: 'ns.test.base.myEntityContext'
        }, edmMetadata);
        var types = metadata.processMetadata();

        expect(types).to.have.length(3)

        var container = types[2];
        expect(container.fullName).to.equals('Default.Container')
        expect(container.baseTypes).to.have.length(4)
        expect(container.baseTypes[2].fullName).to.equals('$data.EntityContext')
        expect(container.baseTypes[3].fullName).to.equals('ns.test.base.myEntityContext')
    });

    it("custom entity entitySet", () => {
        var mySet = $data.EntitySet.extend('ns.test.base.myEntitySet')

        var schema = require('./simpleSchema.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {
            entitySetType: 'ns.test.base.myEntitySet'
        }, edmMetadata);
        var types = metadata.processMetadata();

        expect(types).to.have.length(3)

        var container = types[2];
        var def = container.getMemberDefinition('Articles')
        var elementType = types[0];

        expect(def.name).to.equals('Articles')
        expect(def.type).to.equal(mySet)
        expect(def.originalType).to.equal('ns.test.base.myEntitySet')
        expect(def.elementType).to.equal(elementType)
    });
})


describe("reflect annotations", () => {
    var types = []
    before(() => {
        var schema = require('./schemaAnnot.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {}, edmMetadata);
        types = metadata.processMetadata();
    })

    it("annotation namespace alias", () => {
        var type = types[2]

        expect(Reflect.hasMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.be.true
        expect(Reflect.getMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.equal('true')
    })

    it("schema level class annotation", () => {
        var type = types[5]

        expect(Reflect.hasMetadata('UI.Display', new type())).to.be.true
        expect(Reflect.getMetadata('UI.Display', new type())).to.equal('Category display')
    })

    it("schema level property annotation", () => {
        var type = types[5]

        expect(Reflect.hasMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.be.true
        expect(Reflect.getMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.equal('true')
    })

    it("schema level property annotation multiple", () => {
        var type = types[5]

        expect(Reflect.hasMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.be.true
        expect(Reflect.getMetadata('Org.OData.Core.V1.Computed', new type(), 'Id')).to.equal('true')

        expect(Reflect.hasMetadata('UI.Display', new type(), 'Id')).to.be.true
        expect(Reflect.getMetadata('UI.Display', new type(), 'Id')).to.equal('Identity')
    })

    it("schema level property annotation qualifier", () => {
        var type = types[5]

        expect(Reflect.hasMetadata('Tablet:UI.Display', new type(), 'Title')).to.be.true
        expect(Reflect.getMetadata('Tablet:UI.Display', new type(), 'Title')).to.equal('M Title')
    })

    it("schema level property annotation double qualifier", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Display:Tablet:UI.Display', new type(), 'Body')).to.be.true
        expect(Reflect.getMetadata('Display:Tablet:UI.Display', new type(), 'Body')).to.equal('DM Body')
    })

    it("entity set level annotation", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Org.OData.Core.V1.OptimisticConcurrency', new type())).to.be.true
        expect(Reflect.getMetadata('Org.OData.Core.V1.OptimisticConcurrency', new type())).to.deep.equal(["RowVersion"])
    })

    it("entity set level annotation for property", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Entity.Property.DisplayName', new type(), 'Lead')).to.be.true
        expect(Reflect.getMetadata('Entity.Property.DisplayName', new type(), 'Lead')).to.deep.equal("Entity Lead display")
    })

    it("entity level annotation", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('UI.DisplayName', new type())).to.be.true
        expect(Reflect.getMetadata('UI.DisplayName', new type())).to.deep.equal("Article Display")
    })

    it("entity level annotation for property", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('UI.DisplayName', new type(), 'Lead')).to.be.true
        expect(Reflect.getMetadata('UI.DisplayName', new type(), 'Lead')).to.deep.equal("Lead display")
    })

    it("enum level annotation", () => {
        var type = types[0]

        expect(Reflect.hasMetadata('UI.DisplayName', type)).to.be.true
        expect(Reflect.getMetadata('UI.DisplayName', type)).to.deep.equal("UserType Display")
    })

    it("enum level annotation for property", () => {
        var type = types[0]

        expect(Reflect.hasMetadata('UI.DisplayName', type, 'Guest')).to.be.true
        expect(Reflect.getMetadata('UI.DisplayName', type, 'Guest')).to.deep.equal("Guest display")
    })

    it("property level annotation", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Property.UI.DisplayName', new type(), 'Body')).to.be.true
        expect(Reflect.getMetadata('Property.UI.DisplayName', new type(), 'Body')).to.deep.equal("Body Display")
    })

    it("property level annotation with path", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', new type(), 'Lead')).to.be.false
        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', new type(), 'Body')).to.be.true
        expect(Reflect.getMetadata('Property.Level.With.Path.Annot', new type(), 'Body')).to.deep.equal("annotation value")
    })

    it("navigation property level annotation", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Property.UI.DisplayName', new type(), 'Category')).to.be.true
        expect(Reflect.getMetadata('Property.UI.DisplayName', new type(), 'Category')).to.deep.equal("Articles Display")
    })

    it("navigation property level annotation with path", () => {
        var type = types[3]

        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', new type(), 'Reviewer')).to.be.false
        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', new type(), 'Category')).to.be.true
        expect(Reflect.getMetadata('Property.Level.With.Path.Annot', new type(), 'Category')).to.deep.equal("annotation value")
    })

    it("enum property level annotation", () => {
        var type = types[0]

        expect(Reflect.hasMetadata('Property.UI.DisplayName', type, 'Admin')).to.be.true
        expect(Reflect.getMetadata('Property.UI.DisplayName', type, 'Admin')).to.deep.equal("Admin Display")
    })

    it("enum property level annotation with path", () => {
        var type = types[0]

        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', type, 'Customer')).to.be.false
        expect(Reflect.hasMetadata('Property.Level.With.Path.Annot', type, 'Admin')).to.be.true
        expect(Reflect.getMetadata('Property.Level.With.Path.Annot', type, 'Admin')).to.deep.equal("annotation value")
    })

    it("fix: annotation applied only one type", () => {
        var type = types[3]
        var type2 = types[5]

        expect(Reflect.hasMetadata('Org.OData.Core.V1.OptimisticConcurrency', new type())).to.be.true
        expect(Reflect.getMetadata('Org.OData.Core.V1.OptimisticConcurrency', new type())).to.deep.equal(["RowVersion"])

        expect(Reflect.hasMetadata('Org.OData.Core.V1.OptimisticConcurrency', new type2())).to.be.false
    })
})

describe("annotations on model", () => {
    var types = []
    before(() => {
        var schema = require('./schemaAnnot.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata($data, {}, edmMetadata);
        types = metadata.processMetadata();
    })

    it("computed key", () => {
        var type = types[3];
        expect(type.name).to.equals('Article')

        var def = type.getMemberDefinition('Id')
        expect(def.name).to.equals('Id')
        expect(def.type).to.equal($data.Integer)
        expect(def.originalType).to.equal('Edm.Int32')

        expect(def.key).to.be.true
        expect(def.computed).to.be.true
        expect(def.required).to.be.undefined
    })

    it("concurrencyMode", () => {
        var type = types[3];
        expect(type.name).to.equals('Article')

        var def = type.getMemberDefinition('RowVersion')
        expect(def.name).to.equals('RowVersion')
        expect(def.type).to.equal($data.Blob)
        expect(def.originalType).to.equal('Edm.Binary')

        expect(def.concurrencyMode).to.equal($data.ConcurrencyMode.Fixed)
    })
})


describe("without jaydata", () => {
    it("full generation - exception", () => {
        try {
            var schema = require('./simpleSchema.json')
            var edmMetadata = new Edm.Edmx(schema)
            var metadata = new Metadata({}, {}, edmMetadata);
            var types = metadata.processMetadata();

            expect(true).to.be.false
        } catch (e) {
            expect(e.message).to.equal("Cannot read property 'resolveType' of undefined")
        }
    });

    it("text generation", () => {
        var schema = require('./simpleSchema.json')
        var edmMetadata = new Edm.Edmx(schema)
        var metadata = new Metadata({}, { generateTypes: false }, edmMetadata);
        var types = metadata.processMetadata();

        expect(types).to.have.length(0)
        expect(typeof types.src).to.equal("string")
        expect(types.src).to.equal(require('./simpleSchemaModel.json').src)
    });

    it("typescript d.ts generation", () => {
        var schema = require('./schema2.json');
        var edmMetadata = new Edm.Edmx(schema);
        var metadata = new Metadata({}, { generateTypes: false, namespace: 'almafa', autoCreateContext: 'myContext' }, edmMetadata);
        var types = metadata.processMetadata();

        expect(types).to.have.length(0)
        expect(typeof types.dts).to.equal("string")
        expect(types.dts).to.equal(require('./simpleDTSSchemaModel.json').src);
    });
})
