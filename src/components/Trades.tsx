import { Card, Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useAppSelector } from '../app/hooks'
import {
  filledOrdersGetters,
  filledOrdersLoadedGetters
} from '../features/web3/web3Slice'
const Trades: React.FC = () => {
  const filledOrders = useAppSelector(filledOrdersGetters)
  const filledOrdersLoaded = useAppSelector(filledOrdersLoadedGetters)

  const columns: ColumnsType<{
    tokenPriceClass: string
  }> = [
    {
      title: '时间',
      dataIndex: 'formatTimestamp'
    },
    {
      title: 'DApp',
      dataIndex: 'tokenAmount'
    },
    {
      title: 'DApp/ETH',
      dataIndex: 'tokenPrice',
      onCell: data => {
        return {
          className: data.tokenPriceClass
        }
      }
    }
  ]
  return (
    <Card style={{ width: '100%', height: '100%' }} title="Trades">
      <Table
        loading={!filledOrdersLoaded}
        dataSource={filledOrders}
        columns={columns}
        rowKey="id"
        pagination={false}
      ></Table>
    </Card>
  )
}

export default Trades
