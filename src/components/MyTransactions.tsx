import { Button, Card, Table, Tabs, TabsProps } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { ColumnType } from 'antd/lib/table'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  accountGetters,
  cancellingOrderGetters,
  exchangeGetters,
  myFilledOrdersGetters,
  myFilledOrdersLoadedGetters,
  myOpenOrdersGetters,
  myOpenOrdersLoadedGetters
} from '../features/web3/web3Slice'
import { cancelOrder } from '../features/web3/web3API'
const MyTransactions: React.FC = () => {
  const dispatch = useAppDispatch()
  const exchange = useAppSelector(exchangeGetters)
  const account = useAppSelector(accountGetters)
  const myFilledOrdersLoaded = useAppSelector(myFilledOrdersLoadedGetters)
  const myFilledOrders = useAppSelector(myFilledOrdersGetters)
  const myOpenOrdersLoaded = useAppSelector(myOpenOrdersLoadedGetters)
  const myOpenOrders = useAppSelector(myOpenOrdersGetters)
  const orderCancelling = useAppSelector(cancellingOrderGetters)

  const tabList: TabsProps['items'] = [
    {
      label: 'Trades',
      key: 'trades'
    },
    {
      label: 'Orders',
      key: 'orders'
    }
  ]

  const [state, setState] = useState({
    activeKey: tabList[0].key
  })

  const tradeColumns: ColumnType<{
    orderTypeClass?: string
    orderSign?: string
    tokenAmount?: string
  }>[] = [
    {
      title: '时间',
      dataIndex: 'formatTimestamp'
    },
    {
      title: 'DApp',
      dataIndex: 'tokenAmount',
      render(value, record, index) {
        return (
          <span className={record.orderTypeClass}>
            {record.orderSign}
            {record.tokenAmount}
          </span>
        )
      }
    },
    {
      title: 'DApp/ETH',
      dataIndex: 'tokenPrice',
      onCell: data => {
        return {
          className: data.orderTypeClass
        }
      }
    }
  ]

  const orderColumns: ColumnType<{
    orderTypeClass?: string
  }>[] = [
    {
      title: '金额',
      dataIndex: 'tokenAmount',
      onCell: data => {
        return {
          className: data.orderTypeClass
        }
      }
    },
    {
      title: 'DApp/ETH',
      dataIndex: 'tokenPrice',
      onCell: data => {
        return {
          className: data.orderTypeClass
        }
      }
    },
    {
      title: '操作',
      render(value, record, index) {
        return (
          <Button
            type="text"
            onClick={() => {
              dispatch(cancelOrder({ exchange, account, order: record }))
            }}
            icon={<CloseCircleOutlined />}
          />
        )
      }
    }
  ]

  return (
    <Card
      style={{ flex: 1, marginTop: 10, width: '100%', overflowY: 'scroll' }}
      title="MyTransactions"
    >
      <Tabs
        activeKey={state.activeKey}
        items={tabList}
        onChange={key => {
          setState({
            activeKey: key
          })
        }}
      ></Tabs>
      <Table
        columns={state.activeKey === 'trades' ? tradeColumns : orderColumns}
        rowKey="id"
        pagination={false}
        loading={
          (state.activeKey === 'trades'
            ? !myFilledOrdersLoaded
            : !myOpenOrdersLoaded) || orderCancelling
        }
        dataSource={
          state.activeKey === 'trades' ? myFilledOrders : myOpenOrders
        }
      />
    </Card>
  )
}

export default MyTransactions
