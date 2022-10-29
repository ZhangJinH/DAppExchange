const Token = artifacts.require('Token')
const Exchange = artifacts.require('Exchange')

const ether = n => {
  return new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'))
}
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens = n => ether(n)

function wait(second) {
  return new Promise(resolve => {
    setTimeout(resolve, second * 1000)
  })
}

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts()

    const token = await Token.deployed()

    const exchange = await Exchange.deployed()

    const [sender, receiver] = accounts

    let amount = ether(10000)
    await token.transfer(receiver, amount, { from: sender })
    console.log(`从${sender}转移${amount} tokens 至${receiver}`)

    const [user1, user2] = accounts
    // user1 存入 ether
    amount = ether(1)
    await exchange.depositEther({
      from: user1,
      value: amount
    })
    amount = tokens(10000)
    // user2 更新 token
    await token.approve(exchange.address, amount, { from: user2 })
    // user2 存入 token
    await exchange.depositToken(token.address, amount, { from: user2 })

    // 取消订单

    let result, orderId
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    )
    console.log('用户1 创建订单')
    orderId = result.logs[0].args.id
    await exchange.cancelOrder(orderId, { from: user1 })
    console.log('用户1 取消订单')

    // 下单
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    )
    console.log('用户1 创建订单')
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, { from: user2 })
    console.log('用户2 下单')

    await wait(1)

    // 下单2
    result = await exchange.makeOrder(
      token.address,
      tokens(50),
      ETHER_ADDRESS,
      ether(0.01),
      { from: user1 }
    )
    console.log('用户1 创建订单')
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, { from: user2 })
    console.log('用户2 下单')

    await wait(1)

    // 下单3
    result = await exchange.makeOrder(
      token.address,
      tokens(200),
      ETHER_ADDRESS,
      ether(0.15),
      { from: user1 }
    )
    console.log('用户1 创建订单')
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, { from: user2 })
    console.log('用户2 下单')

    await wait(1)

    // 创建订单
    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        token.address,
        tokens(10 * i),
        ETHER_ADDRESS,
        ether(0.01),
        { from: user1 }
      )
      console.log('用户1 创建订单' + i + 'tokens' + tokens(10 * i))
      await wait(1)
    }

    // 创建订单
    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        ETHER_ADDRESS,
        ether(0.01),
        token.address,
        tokens(10 * i),
        { from: user2 }
      )
      console.log('用户2 创建订单' + i + 'tokens' + tokens(10 * i))
      await wait(1)
    }
  } catch (error) {
    console.error(error)
  }

  callback()
}
