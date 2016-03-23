/// <reference path="../lib/metadata.d.ts" />

var fs = require('fs')
var Edm = require('odata-metadata').Edm
var Metadata = require('../lib/metadata.js').Metadata
var expect = require('chai').expect

var $data = require('jaydata/core')

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
        expect(types.src).to.equal(fs.readFileSync('./tests/simpleSchemaModel.txt', 'utf8'))
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
        expect(types.src).to.equal(fs.readFileSync('./tests/simpleSchemaModel.txt', 'utf8'))
    });
})
