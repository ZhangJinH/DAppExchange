import { useDispatch } from 'react-redux'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { groupBy, maxBy, minBy, reject } from 'lodash'
import { RootState } from '../../app/store'
import Web3 from 'web3'
import { store } from '../../app/store'
import {
  cancelOrder,
  depositEther,
  loadAccount,
  loadAllOrders,
  loadBalances,
  loadExchange,
  loadToken,
  withdrawEther,
  makeBuyOrder,
  makeSellOrder
} from './web3API'
import { ether, ETHER_ADDRESS, tokens } from '../../utils/helpers'
import moment from 'moment'

export interface Web3State {
  connection: Web3 | null
  account: string
  token: any
  exchange: any
  exchangeOrderCancelling: boolean
  cancelledOrders: {
    loaded: boolean
    data: any[]
  }
  filledOrders: {
    loaded: boolean
    data: any[]
  }
  allOrders: {
    loaded: boolean
    data: any[]
  }
  balances: {
    loaded: boolean
    etherBalance: number
    tokenBalance: number
    exchangeEtherBalance: number
    exchangeTokenBalance: number
  }
  orderMaking: boolean
}

const initialState: Web3State = {
  connection: null,
  account: '',
  token: null,
  exchange: null,
  exchangeOrderCancelling: false,
  cancelledOrders: {
    loaded: false,
    data: []
  },
  filledOrders: {
    loaded: false,
    data: []
  },
  allOrders: {
    loaded: false,
    data: []
  },
  balances: {
    loaded: false,
    etherBalance: 0,
    tokenBalance: 0,
    exchangeEtherBalance: 0,
    exchangeTokenBalance: 0
  },
  orderMaking: false
}

export const web3Slice = createSlice({
  name: 'web3',
  initialState,
  // mutations
  reducers: {
    loadWeb3: state => {
      state.connection = new Web3(Web3.givenProvider || 'http://localhost:7545')
    },
    orderCancelled: (state, action: PayloadAction<{}>) => {
      state.cancelledOrders.data.push(action.payload)
    },
    buyOrder: state => {
      state.orderMaking = true
    },
    sellOrder: state => {
      state.orderMaking = true
    },
    orderMade: (state, action: PayloadAction<{ id: any }>) => {
      const index = state.allOrders.data.findIndex(
        i => i.id === action.payload.id
      )
      if (index === -1) {
        state.allOrders.data = [...state.allOrders.data, action.payload]
      }
      state.orderMaking = false
    }
  },
  // reducers Hook function
  extraReducers: builder => {
    builder.addCase(loadAccount.fulfilled, (state, action) => {
      state.account = action.payload
    })
    builder.addCase(loadToken.fulfilled, (state, action) => {
      state.token = action.payload
    })
    builder.addCase(loadExchange.fulfilled, (state, action) => {
      state.exchange = action.payload
      state.exchange.events.Cancel({}, (err: any, event: any) => {
        if (err) {
          console.log(err)
          return
        }
        store.dispatch(orderCancelled(event.returnValues))
      })

      state.exchange.events.Deposit({}, (err: any, event: any) => {
        if (err) {
          console.log(err)
          return
        }
        store.dispatch(
          loadBalances({
            web3: state.connection,
            exchange: state.exchange,
            token: state.token,
            account: state.account
          })
        )
      })

      state.exchange.events.Withdraw({}, (err: any, event: any) => {
        if (err) {
          console.log(err)
          return
        }
        store.dispatch(
          loadBalances({
            web3: state.connection,
            exchange: state.exchange,
            token: state.token,
            account: state.account
          })
        )
      })

      state.exchange.events.Order({}, (err: any, event: any) => {
        if (err) {
          console.log(err)
          return
        }
        store.dispatch(orderMade(event.returnValues))
      })
    })
    builder.addCase(loadAllOrders.fulfilled, (state, action) => {
      const { cancelledOrders, filledOrders, allOrders } = action.payload

      state.cancelledOrders = {
        loaded: true,
        data: cancelledOrders
      }
      state.filledOrders = {
        loaded: true,
        data: filledOrders
      }
      state.allOrders = {
        loaded: true,
        data: allOrders
      }
    })
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      state.exchangeOrderCancelling = false
    })
    builder.addCase(cancelOrder.pending, (state, action) => {
      state.exchangeOrderCancelling = true
    })
    builder.addCase(cancelOrder.rejected, (state, action) => {
      state.exchangeOrderCancelling = false
    })

    builder.addCase(loadBalances.fulfilled, (state, action) => {
      const {
        etherBalance,
        tokenBalance,
        exchangeEtherBalance,
        exchangeTokenBalance
      } = action.payload
      state.balances = {
        loaded: true,
        etherBalance: etherBalance!,
        tokenBalance,
        exchangeEtherBalance,
        exchangeTokenBalance
      }
    })

    builder.addCase(loadBalances.rejected, state => {
      state.balances = {
        loaded: false,
        etherBalance: 0,
        tokenBalance: 0,
        exchangeEtherBalance: 0,
        exchangeTokenBalance: 0
      }
    })
  }
})

export const { loadWeb3, orderCancelled, buyOrder, sellOrder, orderMade } =
  web3Slice.actions

// getters
// export const *** = (state: RootState) => state.web3.
export const web3Getters = (state: RootState) => state.web3.connection
export const accountGetters = (state: RootState) => state.web3.account
export const tokenGetters = (state: RootState) => state.web3.token
export const exchangeGetters = (state: RootState) => state.web3.exchange
export const cancellingOrderGetters = (state: RootState) =>
  state.web3.exchangeOrderCancelling
export const contractLoadedGetters = (state: RootState) =>
  !!state.web3.token && !!state.web3.exchange
export const balancesGetters = (state: RootState) => state.web3.balances

export const orderMakingGetters = (state: RootState) => state.web3.orderMaking

export const openOrdersGetters = (state: RootState) => {
  const all = allOrdersGetters(state)
  const cancelled = cancelledOrdersGetters(state)
  const filled = filledOrdersGetters(state)

  const openOrders = reject(all, (order: any) => {
    const orderFilled = filled.some(i => i.id === order.id)
    const orderCancelled = cancelled.some(i => i.id === order.id)
    return orderFilled || orderCancelled
  })

  return openOrders
}

export const orderBookLoadedGetters = (state: RootState) =>
  allOrdersLoadedGetters(state) &&
  cancelledOrdersLoadedGetters(state) &&
  filledOrdersLoadedGetters(state)

export const orderBookGetters = (state: RootState) => {
  let orders = openOrdersGetters(state)
  orders = decorateOrderBooks(orders)

  const { buy = [], sell = [] } = groupBy(orders, 'orderType')
  const buyOrders = buy
  const sellOrders = sell
  return {
    orders,
    buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
    sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
  }
}

export const allOrdersLoadedGetters = (state: RootState) =>
  state.web3.allOrders.loaded
export const allOrdersGetters = (state: RootState) =>
  state.web3.allOrders.data || []

export const cancelledOrdersLoadedGetters = (state: RootState) =>
  state.web3.cancelledOrders.loaded
export const cancelledOrdersGetters = (state: RootState) =>
  state.web3.cancelledOrders.data || []

export const filledOrdersLoadedGetters = (state: RootState) =>
  state.web3.filledOrders.loaded
export const filledOrdersGetters = (state: RootState) => {
  let orders: any[] = []
  if (state.web3.filledOrders.loaded) {
    orders = [...state.web3.filledOrders.data]
  }
  orders = orders.sort((a, b) => a.timestamp - b.timestamp)

  orders = decorateFilledOrders(orders)
  orders = orders.sort((a, b) => b.timestamp - a.timestamp)

  return orders
}

export const myFilledOrdersLoadedGetters = (state: RootState) =>
  filledOrdersLoadedGetters(state)
export const myFilledOrdersGetters = (state: RootState) => {
  const account = accountGetters(state)
  let orders = filledOrdersGetters(state).filter(
    i => i.user === account || i.userFill === account
  )
  orders.sort((a, b) => a.timestamp - b.timestamp)
  return decorateMyFilledOrders(orders, account)
}

export const myOpenOrdersLoadedGetters = (state: RootState) =>
  orderBookLoadedGetters(state)
export const myOpenOrdersGetters = (state: RootState) => {
  const account = accountGetters(state)
  let orders = openOrdersGetters(state).filter(
    i => i.user === account || i.userFill === account
  )

  orders.sort((a, b) => b.timestamp - a.timestamp)
  return decorateMyOpenOrders(orders, account)
}

export const priceChartLoadedGetters = (state: RootState) =>
  filledOrdersLoadedGetters(state)
export const priceChartGetters = (state: RootState) => {
  const orders = filledOrdersGetters(state)
  orders.sort((a, b) => a.timestamp - b.timestamp)
  const data = orders.map(decorateOrder)
  if (data.length <= 2)
    return {
      lastPrice: 0,
      lastPriceChange: '',
      series: []
    }

  const [secondLastOrder, lastOrder] = data.slice(data.length - 2, data.length)

  const lastPrice = lastOrder.tokenPrice || 0
  const secondLastPrice = secondLastOrder.tokenPrice || 0

  return {
    lastPrice,
    lastPriceChange: lastPrice >= secondLastPrice ? '+' : '-',
    series: [
      {
        data: buildGraphData(data)
      }
    ]
  }
}

const buildGraphData = (orders: any[]) => {
  const data = groupBy(orders, o =>
    moment.unix(o.timestamp).startOf('hour').format()
  )
  const hours = Object.keys(data)
  const graphData = hours.map(hour => {
    const group = data[hour]
    const open = group[0]
    const high = maxBy(group, 'tokenPrice')
    const low = minBy(group, 'tokenPrice')
    const close = group[group.length - 1]
    return {
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
    }
  })
  return graphData
}

const decorateOrder = (order: any) => {
  let etherAmount, tokenAmount
  if (order.tokenGive === ETHER_ADDRESS) {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.amountGive
  }
  const precision = 100000
  let tokenPrice = etherAmount / tokenAmount
  tokenPrice = Math.round(tokenPrice * precision) / precision
  let formatTimestamp = moment.unix(order.timestamp).format('HH:mm:ss M/D')
  return {
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formatTimestamp
  }
}
const decorateFilledOrder = (order: any, previousOrder: any) => {
  return {
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  }
}

const decorateFilledOrders = (orders: any[]) => {
  let previousOrder: any = orders[0]
  return orders.map(order => {
    order = decorateOrder(order)
    order = decorateFilledOrder(order, previousOrder)
    previousOrder = order
    return order
  })
}

const tokenPriceClass = (tokenPrice: any, orderId: any, previousOrder: any) => {
  if (previousOrder.orderId === orderId) return 'green'
  if (previousOrder.tokenPrice <= tokenPrice) return 'green'
  return 'red'
}

const decorateOrderBooks = (orders: any[]) => {
  return orders.map(order => {
    order = decorateOrder(order)
    order = decorateOrderBook(order)
    return order
  })
}

const decorateOrderBook = (order: any) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? 'green' : 'red',
    orderFillClass: orderType === 'buy' ? 'sell' : 'buy'
  }
}

const decorateMyFilledOrders = (orders: any[], account: string) => {
  return orders.map(order => {
    order = decorateOrder(order)
    order = decorateMyFilledOrder(order, account)
    return order
  })
}

const decorateMyFilledOrder = (order: any, account: string) => {
  const myOrder = order.user === account
  let orderType

  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
  }

  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? 'green' : 'red',
    orderSign: orderType === 'buy' ? '+' : '-'
  }
}

const decorateMyOpenOrders = (orders: any[], account: string) => {
  return orders.map(order => {
    order = decorateOrder(order)
    order = decorateMyOpenOrder(order, account)
    return order
  })
}

const decorateMyOpenOrder = (order: any, account: string) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? 'green' : 'red'
  }
}

export default web3Slice.reducer
