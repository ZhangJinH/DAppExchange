const Token = artifacts.require('./Token')
const { tokens, EVM_REVERT } = require('./helpers')
require('chai').use(require('chai-as-promised')).should()

contract('Token', ([deployer, receiver, exchange]) => {
  let token
  const name = 'DApp Token'
  const symbol = 'DAPP'
  const decimals = '18'
  const totalSupply = tokens(1000000)

  beforeEach(async () => {
    // fetch token from blockchain
    token = await Token.new()
  })

  describe('deployment', () => {
    it('track the name', async () => {
      // read name
      const result = await token.name()
      // check name is My Name
      result.should.equal(name)
    })

    it('track the symbol', async () => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })

    it('track the decimals', async () => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })

    it('track the total supply', async () => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply.toString())
    })

    it('assign the totalSupply to message sender', async () => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply.toString())
    })
  })

  describe('sending tokens', () => {
    let amount
    let result

    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(100)
        result = await token.transfer(receiver, amount, {
          from: deployer,
        })
      })
      it('trasfer token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('emits a transfer event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.toString().should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })
    })

    describe('failure', () => {
      it('rejects insufficient balances', async () => {
        let invalidAmount = tokens(10000000)
        await token
          .transfer(receiver, invalidAmount, {
            from: deployer,
          })
          .should.be.rejectedWith(EVM_REVERT)

        invalidAmount = tokens(10)

        await token
          .transfer(deployer, invalidAmount, {
            from: receiver,
          })
          .should.be.rejectedWith(EVM_REVERT)
      })

      it('rejects invalid recipients', async () => {
        await token.transfer(0x0, amount, {
          from: deployer,
        }).should.be.rejected
      })
    })
  })

  describe('approving tokens', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = tokens(100)
      result = await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', () => {
      it('allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(amount.toString())
      })
      it('emits a approval event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Approval')
        const event = log.args
        event.owner.toString().should.equal(deployer, 'owner is correct')
        event.spender.toString().should.equal(exchange, 'spender is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })
    })

    describe('failure', () => {
      it('rejects invalid spender', async () => {
        await token.transfer(0x0, amount, {
          from: deployer,
        }).should.be.rejected
      })
    })
  })

  describe('delegated token transfer', () => {
    let amount
    let result

    beforeEach(async () => {
      amount = tokens(100)
      await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, amount, {
          from: exchange,
        })
      })
      it('trasfer token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('resets the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })

      it('emits a transfer event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.toString().should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(), 'value is correct')
      })
    })

    describe('failure', () => {
      it('rejects insufficient amounts', async () => {
        let invalidAmount = tokens(10000000)
        await token
          .transferFrom(deployer, receiver, invalidAmount, {
            from: exchange,
          })
          .should.be.rejectedWith(EVM_REVERT)
      })

      it('rejects invalid recipients', async () => {
        await token.transferFrom(0x0, amount, {
          from: deployer,
        }).should.be.rejected
      })
    })
  })
})
