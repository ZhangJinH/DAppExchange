import { Row, Col, Card } from 'antd'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { loadAllOrders } from '../features/web3/web3API'
import { exchangeGetters } from '../features/web3/web3Slice'
import Balance from './Balance'
import MyTransactions from './MyTransactions'
import NewOrder from './NewOrder'
import OrderBook from './OrderBook'
import PriceChart from './PriceChart'
import Trades from './Trades'

const Content: React.FC = () => {
  const dispatch = useAppDispatch()
  const exchange = useAppSelector(exchangeGetters)

  useEffect(() => {
    dispatch(loadAllOrders(exchange))
  }, [dispatch, exchange])

  return (
    <>
      <Row gutter={[16, 16]} style={{ height: '100%', padding: 20 }}>
        <Col span={5}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Balance />
            <NewOrder />
          </div>
        </Col>
        <Col span={5}>
          <OrderBook />
        </Col>
        <Col span={9}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <PriceChart />
            <MyTransactions />
          </div>
        </Col>
        <Col span={5}>
          <Trades />
        </Col>
      </Row>
    </>
  )
}

export default Content
