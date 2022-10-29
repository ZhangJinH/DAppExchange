const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')
const { tokens, EVM_REVERT, ETHER_ADDRESS, ether } = require('./helpers')
require('chai').use(require('chai-as-promised')).should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
  let token
  let exchange
  const feePercent = 10

  beforeEach(async () => {
    // deploy token
    token = await Token.new()
    exchange = await Exchange.new(feeAccount, feePercent)
    // transfer some tokens to user1
    await token.transfer(user1, tokens(100), { from: deployer })
  })

  describe('deployment', () => {
    it('track the feeAccount', async () => {
      // read name
      const result = await exchange.feeAccount()
      // check name is My Name
      result.should.equal(feeAccount)
    })

    it('track the feePercent', async () => {
      // read name
      const result = await exchange.feePercent()
      // check name is My Name
      result.toString().should.equal(feePercent.toString())
    })
  })

  describe('fallback', () => {
    it('revert when ether sent', async () => {
      await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
    })
  })

  describe('depositing ether', () => {
    let result
    let amount
    beforeEach(async () => {
      amount = ether(1)
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      })
    })

    it('tracks the Ether deposit', async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1)
      balance.toString().should.equal(amount.toString())
    })

    it('emits a deposit event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Deposit')
      const event = log.args
      event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct')
      event.user.toString().should.equal(user1, 'user is correct')
      event.amount.toString().should.equal(amount.toString(), 'amount is correct')
      event.balance.toString().should.equal(amount.toString(), 'balance is correct')
    })
  })

  describe('withdraw ehter', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = ether(1)
      await exchange.depositEther({
        value: amount,
        from: user1,
      })
    })
    describe('success', () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, {
          from: user1,
        })
      })

      it('withdraw ether balance', async () => {
        const balanceOf = await token.balanceOf(ETHER_ADDRESS)
        balanceOf.toString().should.equal('0')
      })

      it('emits a withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct')
        event.user.toString().should.equal(user1, 'user is correct')
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal('0', 'balance is correct')
      })
    })
    describe('failure', () => {
      it('exchange withdraw for insufficient amount', async () => {
        await exchange
          .withdrawEther(ether(100), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('depositing tokens', () => {
    let result
    let amount
    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(10)
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        })
      })
      it('track the token deposit', async () => {
        let balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal(amount.toString())
      })
      it('emits a deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.toString().should.equal(token.address, 'token is correct')
        event.user.toString().should.equal(user1, 'user is correct')
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal(amount.toString(), 'balance is correct')
      })
    })
    describe('failure', () => {
      it('reject Ether deposits', async () => {
        await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails when no tokens are approved', async () => {
        await exchange
          .depositToken(token.address, tokens(10), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('withdraw token', () => {
    let amount
    let result
    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(10)
        await token.approve(exchange.address, amount, { from: user1 })
        await exchange.depositToken(token.address, amount, {
          from: user1,
        })
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        })
      })
      it('withdraw token funds', async () => {
        const balanceOf = await exchange.tokens(token.address, user1)
        balanceOf.toString().should.equal('0')
      })
      it('emits a withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.toString().should.equal(token.address, 'token is correct')
        event.user.toString().should.equal(user1, 'user is correct')
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal('0', 'balance is correct')
      })
    })
    describe('failure', () => {
      it('reject Ether deposits', async () => {
        await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails when no tokens are approved', async () => {
        await exchange
          .depositToken(token.address, tokens(10), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('checking balance', () => {
    beforeEach(async () => {
      await exchange.depositEther({
        from: user1,
        value: ether(1),
      })
    })

    it('return user balance', async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
      result.toString().should.equal(ether(1).toString())
    })
  })

  describe('making orders', () => {
    let result
    beforeEach(async () => {
      result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {
        from: user1,
      })
    })

    it('track the newly created order', async () => {
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1')
      order.user.toString().should.equal(user1)
      order.tokenGet.toString().should.equal(token.address)
      order.amountGet.toString().should.equal(tokens(1).toString())
      order.tokenGive.toString().should.equal(ETHER_ADDRESS)
      order.amountGive.toString().should.equal(ether(1).toString())
      order.timestamp.toString().length.should.be.at.least(1)
    })

    it('emits a order event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Order')
      const event = log.args
      event.id.toString().should.equal('1')
      event.user.toString().should.equal(user1)
      event.tokenGet.toString().should.equal(token.address)
      event.amountGet.toString().should.equal(tokens(1).toString())
      event.tokenGive.toString().should.equal(ETHER_ADDRESS)
      event.amountGive.toString().should.equal(ether(1).toString())
      event.timestamp.toString().length.should.be.at.least(1)
    })
  })

  describe('order actions', () => {
    beforeEach(async () => {
      // 用户1 只往ether账户存
      await exchange.depositEther({
        from: user1,
        value: ether(1),
      })
      // 将token 给user2
      await token.transfer(user2, tokens(100), {
        from: deployer,
      })
      // 用户2 往ether账户存
      await token.approve(exchange.address, tokens(2), {
        from: user2,
      })
      await exchange.depositToken(token.address, tokens(2), {
        from: user2,
      })
      // 用户1 创建订单
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {
        from: user1,
      })
    })

    describe('filling orders', () => {
      let result
      describe('success', () => {
        beforeEach(async () => {
          // 用户2 购买订单
          result = await exchange.fillOrder('1', {
            from: user2,
          })
        })

        it('excute the trade && charge fee', async () => {
          let balance
          balance = await exchange.balanceOf(token.address, user1)
          balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
          balance.toString().should.equal(ether(1).toString(), 'user2 receive ether')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
          balance.toString().should.equal('0', 'user2 ether deducted')
          balance = await exchange.balanceOf(token.address, user2)
          balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
          const feeAccount = await exchange.feeAccount()
          balance = await exchange.balanceOf(token.address, feeAccount)
          balance.toString().should.equal(tokens(0.1).toString(), 'fee applied in feeAccount')
        })

        it('updates filled order', async () => {
          const orderFilled = await exchange.orderFilled(1)
          orderFilled.should.equal(true)
        })

        it('emits a trade event', async () => {
          const log = result.logs[0]
          log.event.should.equal('Trade')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.toString().should.equal(user1)
          event.tokenGet.toString().should.equal(token.address)
          event.amountGet.toString().should.equal(tokens(1).toString())
          event.tokenGive.toString().should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(ether(1).toString())
          event.userFill.toString().should.equal(user2)
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })
      describe('failure', () => {
        it('reject invalid order id', async () => {
          const invalidOrderId = 999
          await exchange
            .cancelOrder(invalidOrderId, {
              from: user1,
            })
            .should.be.rejectedWith(EVM_REVERT)
        })
        it('reject already fullfilled order', async () => {
          await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
          await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
        it('reject already cancelled order', async () => {
          await exchange.cancelOrder('1', {
            from: user1,
          }).should.be.fulfilled
          await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })

    describe('canceling orders', () => {
      let result

      describe('success', () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder('1', {
            from: user1,
          })
        })

        it('updates cancelled orders', async () => {
          const orderCancelled = await exchange.orderCancelled(1)
          orderCancelled.should.equal(true)
        })

        it('emits a cancel event', async () => {
          const log = result.logs[0]
          log.event.should.equal('Cancel')
          const event = log.args
          event.id.toString().should.equal('1')
          event.user.toString().should.equal(user1)
          event.tokenGet.toString().should.equal(token.address)
          event.amountGet.toString().should.equal(tokens(1).toString())
          event.tokenGive.toString().should.equal(ETHER_ADDRESS)
          event.amountGive.toString().should.equal(ether(1).toString())
          event.timestamp.toString().length.should.be.at.least(1)
        })
      })
      describe('failure', () => {
        it('reject invalid order id', async () => {
          const invalidOrderId = 999
          await exchange
            .cancelOrder(invalidOrderId, {
              from: user1,
            })
            .should.be.rejectedWith(EVM_REVERT)
        })
        it('reject unauthorized cancelations', async () => {
          await exchange
            .cancelOrder('1', {
              from: user2,
            })
            .should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
  })
})
