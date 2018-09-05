global.BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .use(require('chai-as-promised'))
    .should();


const utils = require('../shared/utils');
const fixtureBody = require('./fixtures/body');
const DeclarationOfLove = artifacts.require('DeclarationOfLove');

contract('DeclarationOfLove', async (accounts) => {
    beforeEach(async () => {
        this.price = 100;
        this.target = await DeclarationOfLove.new();
    });

    describe('add', async () => {
        describe('checks', async () => {
            it('should revert if `fronName` is empty', async () => {
                await this.target.add('', 'b', 'c', { value: this.price })
                    .should.be.rejectedWith(utils.EVMRevert);
            });

            it('should revert if `toName` is empty', async () => {
                await this.target.add('a', '', 'b', {value: this.price})
                    .should.be.rejectedWith(utils.EVMRevert);
            });

            it('should revert if `body` is empty', async () => {
                await this.target.add('a', 'b', '', {value: this.price})
                    .should.be.rejectedWith(utils.EVMRevert);
            });

            it('should revert if value lt price', async () => {
                await this.target.add('a', 'b', 'c', {value: this.price - 1})
                    .should.be.rejectedWith(utils.EVMRevert);
            });

            it('should revert if one records is already exists for given sender', async () => {
                await this.target.add('a', 'b', 'c', {value: this.price})
                    .should.be.fulfilled;

                await this.target.add('a', 'b', 'c', {value: this.price})
                    .should.be.rejectedWith(utils.EVMRevert);
            });
        });

        describe('should add', async () => {
            const sender = accounts[1];
            const owner = accounts[0];

            let txOut;
            let logs;
            let senderBalanceBefore;
            let ownerBalanceBefore;

            beforeEach(async () => {
                senderBalanceBefore = await web3.eth.getBalance(sender);
                ownerBalanceBefore = await web3.eth.getBalance(owner);

                txOut = await this.target.add('a', 'b', fixtureBody, { value: this.price, from: sender })
                    .should.be.fulfilled;
                logs = txOut.logs;
            });

            it('get record', async () => {
                await this.target.recordOf(sender)
                    .should.be.fulfilled;
            });

            it('match data', async () => {
                const record = await this.target.recordOf(sender);

                record[0].should.bignumber.gt(0);
                record[1].should.equal('a');
                record[2].should.equal('b');
                record[3].should.equal(fixtureBody);
                record[4].should.bignumber.eq(0);
            });

            it('donate', async () => {
                const ownerBalance = await web3.eth.getBalance(owner);

                ownerBalance.should.bignumber.eq(ownerBalanceBefore.plus(this.price));
            });

            it('emit event', async () => {
                const event = utils.inLogs(logs, 'RecordAdded');

                event.args.sender.should.be.eq(sender);
                event.args.fromName.should.be.eq('a');
                event.args.toName.should.be.eq('b');
            });

            it('emit donate event', async () => {
                const event = utils.inLogs(logs, 'Donate');

                event.args.sender.should.be.eq(sender);
                event.args.amount.should.bignumber.eq(this.price);
            });
        });
    });

    describe('like', async () => {
        const sender = accounts[2];
        const acc = accounts[3];

        beforeEach(async () => {
            await this.target.add('a', 'b', 'c', {value: this.price, from: sender})
        });


        it('should revert if address is zero', async () => {
            await this.target.like(0, { from: acc })
                .should.be.rejectedWith(utils.EVMRevert);
        });

        it('should like successful', async () => {
            await this.target.like(sender, {from: acc})
                .should.be.fulfilled;
        });

        it('should increment likes in record', async () => {
            await this.target.like(sender, {from: acc})

            const record = await this.target.recordOf(sender);

            record[4].should.bignumber.eq(1);
        });

        it('should revert if like is already exists', async () => {
            await this.target.like(sender, {from: acc})
                .should.be.fulfilled;

            await this.target.like(sender, {from: acc})
                .should.be.rejectedWith(utils.EVMRevert);
        });
    });
});
