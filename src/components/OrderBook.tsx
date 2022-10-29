import { Card, Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useAppSelector } from '../app/hooks'
import {
  orderBookGetters,
  orderBookLoadedGetters
} from '../features/web3/web3Slice'

const OrderBook: React.FC = () => {
  const orderBookLoaded = useAppSelector(orderBookLoadedGetters)
  const orderBook = useAppSelector(orderBookGetters)

  const columns: ColumnsType<{
    orderTypeClass: string
  }> = [
    {
      title: 'DApp',
      dataIndex: 'tokenAmount'
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
      title: 'ETH',
      dataIndex: 'etherAmount'
    }
  ]
  return (
    <Card
      style={{ width: '100%', height: '100%', overflowY: 'scroll' }}
      title="OrderBook"
    >
      <Table
        loading={!orderBookLoaded}
        dataSource={orderBook.sellOrders}
        columns={columns}
        rowKey="id"
        pagination={false}
      ></Table>
      <Table
        loading={!orderBookLoaded}
        dataSource={orderBook.buyOrders}
        columns={columns}
        rowKey="id"
        pagination={false}
      ></Table>
    </Card>
  )
}

export default OrderBook
