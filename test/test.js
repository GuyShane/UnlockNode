const chai=require('chai');

const unlock=require('../unlock');

const expect=chai.expect;

describe('Unlock node library tests', function(){
    describe('Options validation', function(){
        it('should fail if no server is passed', function(){
            expect(unlock.init.bind(null, {
                apiKey: 'key',
                version: 1,
                onResponse: function(){}
            })).to.throw();
        });
    });
});
