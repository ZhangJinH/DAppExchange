import { ETHER_ADDRESS, formatBalance } from './../../utils/helpers'
import { createAsyncThunk } from '@reduxjs/toolkit'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { message } from 'antd'

import Token from '../../abis/Token.json'
import Exchange from '../../abis/Exchange.json'

interface ContractProps {
  abi: AbiItem[]
  networks: {
    [props: string]: any
  }
}
export const loadAccount = createAsyncThunk(
  'web3/loadAccount',
  async (web3: Web3 | null) => {
    let account = ''
    if (web3) {
      const accounts = await web3.eth.getAccounts()
      account = accounts[0]
    }
    return account
  }
)

export const loadToken = createAsyncThunk(
  'web3/loadToken',
  async (web3: Web3 | null) => {
    let token = null
    if (web3) {
      try {
        const networkId = await web3.eth.net.getId()
        token = await new web3.eth.Contract(
          (Token as ContractProps).abi as AbiItem[],
          (Token as ContractProps).networks[networkId].address as string
        )
      } catch (error) {
        message.error('当前连接的网络中不包含token 合约，请切换网络')
        return null
      }
    }
    return token
  }
)

export const loadExchange = createAsyncThunk(
  'web3/loadExchange',
  async (web3: Web3 | null) => {
    let exchange = null
    if (web3) {
      try {
        const networkId = await web3.eth.net.getId()
        exchange = await new web3.eth.Contract(
          (Exchange as ContractProps).abi as AbiItem[],
          (Exchange as ContractProps).networks[networkId].address as string
        )
      } catch (error) {
        message.error('当前连接的网络中不包含exchange 合约，请切换网络')
        return null
      }
    }
    return exchange
  }
)

export const loadAllOrders = createAsyncThunk(
  'web3/loadAllOrders',
  async (exchange: any) => {
    const cancelStream = await exchange.getPastEvents('Cancel', {
      fromBlock: 0,
      toBlock: 'latest'
    })

    const cancelledOrders = cancelStream.map((order: any) => order.returnValues)

    const tradeStream = await exchange.getPastEvents('Trade', {
      fromBlock: 0,
      toBlock: 'latest'
    })
    const filledOrders = tradeStream.map((order: any) => order.returnValues)

    const orderStream = await exchange.getPastEvents('Order', {
      fromBlock: 0,
      toBlock: 'latest'
    })
    const allOrders = orderStream.map((order: any) => order.returnValues)

    return {
      cancelledOrders,
      filledOrders,
      allOrders
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'web3/cancelOrder',
  async ({
    exchange,
    order,
    account
  }: {
    exchange: any
    order: any
    account: any
  }) => {
    const hash = await cancelOrderAPI({ exchange, account, order })
    return {
      hash
    }
  }
)

const cancelOrderAPI = ({
  exchange,
  order,
  account
}: {
  exchange: any
  order: any
  account: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .cancelOrder(order.id)
      .send({ from: account })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}

export const loadBalances = createAsyncThunk(
  'web3/loadBalances',
  async ({
    exchange,
    account,
    web3,
    token
  }: {
    web3: any
    exchange: any
    token: any
    account: any
  }) => {
    const [
      etherBalance,
      tokenBalance,
      exchangeEtherBalance,
      exchangeTokenBalance
    ] = await Promise.all([
      web3.eth.getBalance(account),
      token.methods.balanceOf(account).call(),
      exchange.methods.balanceOf(ETHER_ADDRESS, account).call(),
      exchange.methods.balanceOf(token.options.address, account).call()
    ])
    return {
      etherBalance: formatBalance(etherBalance),
      tokenBalance: formatBalance(tokenBalance),
      exchangeEtherBalance: formatBalance(exchangeEtherBalance),
      exchangeTokenBalance: formatBalance(exchangeTokenBalance)
    }
  }
)

export const depositEther = createAsyncThunk(
  'web3/depositEther',
  async ({
    exchange,
    account,
    web3,
    amount
  }: {
    web3: any
    exchange: any
    account: any
    amount: any
  }) => {
    try {
      const hash = await depositEtherAPI({
        exchange,
        account,
        web3,
        amount
      })

      return hash
    } catch (error) {
      console.log(error)
    }
  }
)

const depositEtherAPI = ({
  exchange,
  account,
  web3,
  amount
}: {
  web3: any
  exchange: any
  account: any
  amount: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .depositEther()
      .send({
        from: account,
        value: web3.utils.toWei(amount, 'ether')
      })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}

export const withdrawEther = createAsyncThunk(
  'web3/withdrawEther',
  async ({
    exchange,
    account,
    web3,
    amount
  }: {
    web3: any
    exchange: any
    account: any
    amount: any
  }) => {
    const hash = await withdrawEtherAPI({ exchange, account, web3, amount })
    return hash
  }
)
export const withdrawEtherAPI = ({
  exchange,
  account,
  web3,
  amount
}: {
  web3: any
  exchange: any
  account: any
  amount: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .withdrawEther(web3.utils.toWei(amount, 'ether'))
      .send({
        from: account
      })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}

export const depositToken = createAsyncThunk(
  'web3/depositToken',
  async ({
    exchange,
    token,
    account,
    web3,
    amount
  }: {
    exchange: any
    web3: any
    token: any
    account: any
    amount: any
  }) => {
    try {
      const hash = await depositTokenAPI({
        exchange,
        token,
        account,
        web3,
        amount
      })

      return hash
    } catch (error) {
      console.log(error)
    }
  }
)

const depositTokenAPI = ({
  exchange,
  token,
  account,
  web3,
  amount
}: {
  exchange: any
  web3: any
  token: any
  account: any
  amount: any
}) => {
  return new Promise((resolve, reject) => {
    const value = web3.utils.toWei(amount, 'ether')
    token.methods
      .approve(exchange.options.address, value)
      .send({ from: account })
      .on('transactionHash', (hash: string) => {
        exchange.methods
          .depositToken(token.options.address, value)
          .send({
            from: account
          })
          .on('transactionHash', (hash: string) => {
            resolve(hash)
          })
          .on('error', (err: any) => {
            console.error(err)
            if (err.code === 4001) {
              message.error('用户拒绝了操作')
            }
            reject(err)
          })
      })
  })
}

export const withdrawToken = createAsyncThunk(
  'web3/withdrawToken',
  async ({
    exchange,
    token,
    account,
    web3,
    amount
  }: {
    exchange: any
    web3: any
    token: any
    account: any
    amount: any
  }) => {
    const hash = await withdrawTokenAPI({
      exchange,
      token,
      account,
      web3,
      amount
    })
    return hash
  }
)
export const withdrawTokenAPI = ({
  exchange,
  token,
  account,
  web3,
  amount
}: {
  exchange: any
  web3: any
  token: any
  account: any
  amount: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether'))
      .send({
        from: account
      })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}

export const makeBuyOrder = createAsyncThunk(
  'web3/makeBuyOrder',
  async ({
    exchange,
    token,
    account,
    web3,
    amount,
    price
  }: {
    exchange: any
    web3: any
    token: any
    account: any
    amount: any
    price: any
  }) => {
    const tokenGet = token.options.address
    const amountGet = web3.utils.toWei(amount, 'ether')
    const tokenGive = ETHER_ADDRESS
    const amountGive = web3.utils.toWei((price * amount).toString(), 'ether')

    const hash = await makeBuyOrderAPI({
      exchange,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      account
    })
    return hash
  }
)

const makeBuyOrderAPI = ({
  exchange,
  tokenGet,
  account,
  amountGet,
  tokenGive,
  amountGive
}: {
  exchange: any
  tokenGet: any
  account: any
  amountGet: any
  tokenGive: any
  amountGive: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive)
      .send({ from: account })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}

export const makeSellOrder = createAsyncThunk(
  'web3/makeSellOrder',
  async ({
    exchange,
    token,
    account,
    web3,
    amount,
    price
  }: {
    exchange: any
    web3: any
    token: any
    account: any
    amount: any
    price: any
  }) => {
    const tokenGet = ETHER_ADDRESS
    const amountGet = web3.utils.toWei((price * amount).toString(), 'ether')
    const tokenGive = token.options.address
    const amountGive = web3.utils.toWei(amount, 'ether')
    const hash = await makeSellOrderAPI({
      exchange,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      account
    })
    return hash
  }
)

const makeSellOrderAPI = ({
  exchange,
  tokenGet,
  account,
  amountGet,
  tokenGive,
  amountGive
}: {
  exchange: any
  tokenGet: any
  account: any
  amountGet: any
  tokenGive: any
  amountGive: any
}) => {
  return new Promise((resolve, reject) => {
    exchange.methods
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive)
      .send({ from: account })
      .on('transactionHash', (hash: string) => {
        resolve(hash)
      })
      .on('error', (err: any) => {
        console.error(err)
        if (err.code === 4001) {
          message.error('用户拒绝了操作')
        }
        reject(err)
      })
  })
}
