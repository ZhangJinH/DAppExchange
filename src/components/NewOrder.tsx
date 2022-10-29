import { useState } from 'react'
import {
  Button,
  Card,
  Input,
  InputNumber,
  Row,
  Spin,
  Tabs,
  TabsProps
} from 'antd'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  accountGetters,
  buyOrder,
  exchangeGetters,
  orderMakingGetters,
  sellOrder,
  tokenGetters,
  web3Getters
} from '../features/web3/web3Slice'
import { makeBuyOrder, makeSellOrder } from '../features/web3/web3API'

const NewOrder: React.FC = () => {
  const tabList: TabsProps['items'] = [
    {
      label: '买',
      key: 'buy'
    },
    {
      label: '卖',
      key: 'sell'
    }
  ]
  const dispatch = useAppDispatch()
  const orderMaking = useAppSelector(orderMakingGetters)
  const web3 = useAppSelector(web3Getters)
  const account = useAppSelector(accountGetters)
  const exchange = useAppSelector(exchangeGetters)
  const token = useAppSelector(tokenGetters)

  const [state, setState] = useState<{
    activeKey: string
    price: number
    amount: number
  }>({
    activeKey: tabList[0].key,
    price: 0,
    amount: 0
  })

  const doAction = () => {
    const { activeKey } = state
    if (activeKey === 'buy') {
      dispatch(buyOrder)
      dispatch(
        makeBuyOrder({
          exchange,
          price: state.price + '',
          amount: state.amount + '',
          web3,
          token,
          account
        })
      )
    } else {
      dispatch(sellOrder)
      dispatch(
        makeSellOrder({
          exchange,
          price: state.price + '',
          amount: state.amount + '',
          web3,
          token,
          account
        })
      )
    }
  }

  return (
    <Card style={{ flex: 1, marginTop: 10 }} title="NewOrder">
      <Spin spinning={orderMaking}>
        <Tabs
          accessKey={state.activeKey}
          items={tabList}
          onChange={key => {
            setState({
              ...state,
              activeKey: key
            })
          }}
        />
        <div>{state.activeKey} Amount (DApp)</div>
        <InputNumber
          value={state.amount}
          onChange={val =>
            setState({
              ...state,
              amount: +val!
            })
          }
          placeholder={state.activeKey + ' Amount'}
        />
        <div style={{ marginTop: 10 }}>{state.activeKey} Price</div>
        <InputNumber
          value={state.price}
          onChange={val =>
            setState({
              ...state,
              price: +val!
            })
          }
          placeholder={state.activeKey + ' Price'}
        />
        <div>
          <Button
            onClick={() => {
              doAction()
            }}
            style={{ marginTop: 10 }}
            type="primary"
          >
            {state.activeKey + ' order'}
          </Button>
          <span>Total: {state.amount * state.price} ETH</span>
        </div>
      </Spin>
    </Card>
  )
}
export default NewOrder
