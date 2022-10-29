import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Spin,
  Table,
  Tabs,
  TabsProps
} from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  depositEther,
  depositToken,
  loadBalances,
  withdrawEther,
  withdrawToken
} from '../features/web3/web3API'
import {
  accountGetters,
  balancesGetters,
  contractLoadedGetters,
  exchangeGetters,
  tokenGetters,
  web3Getters
} from '../features/web3/web3Slice'

const Balance: React.FC = () => {
  const dispatch = useAppDispatch()
  const web3 = useAppSelector(web3Getters)
  const exchange = useAppSelector(exchangeGetters)
  const token = useAppSelector(tokenGetters)
  const account = useAppSelector(accountGetters)
  const contractLoaded = useAppSelector(contractLoadedGetters)
  const balances = useAppSelector(balancesGetters)

  const tabList: TabsProps['items'] = [
    { label: '存', key: 'Deposit' },
    { label: '取', key: 'Withdraw' }
  ]
  const [state, setState] = useState<{
    activeKey: string
    etherValue: string
    tokenValue: string
  }>({
    activeKey: tabList[0].key,
    etherValue: '',
    tokenValue: ''
  })

  useEffect(() => {
    if (contractLoaded) {
      dispatch(
        loadBalances({
          web3,
          exchange,
          token,
          account
        })
      )
    }
  }, [dispatch, contractLoaded])

  const balanceColumns: ColumnType<{}>[] = [
    {
      title: 'Token',
      dataIndex: 'name'
    },
    {
      title: 'Wallet',
      dataIndex: 'wallet'
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange'
    }
  ]

  const balanceData: any[] = [
    {
      name: 'ETH',
      wallet: balances.etherBalance,
      exchange: balances.exchangeEtherBalance
    },
    {
      name: 'DApp',
      wallet: balances.tokenBalance,
      exchange: balances.exchangeTokenBalance
    }
  ]

  return (
    <Card style={{ flex: 1 }} title="Balance">
      <Spin spinning={!balances.loaded}>
        <Tabs
          activeKey={state.activeKey}
          items={tabList}
          onChange={key => {
            setState({
              ...state,
              activeKey: key
            })
          }}
        />
        <Table
          columns={balanceColumns}
          rowKey="name"
          pagination={false}
          dataSource={balanceData}
        />

        <Row gutter={20} style={{ marginTop: 10 }}>
          <Col span={10}>
            <Input
              value={state.etherValue}
              placeholder="ETH amount"
              onChange={e =>
                setState({
                  ...state,
                  etherValue: e.target.value
                })
              }
            />
          </Col>
          <Col span={6}>
            {state.activeKey === 'Deposit' ? (
              <Button
                onClick={() => {
                  dispatch(
                    depositEther({
                      exchange,
                      amount: state.etherValue,
                      web3,
                      account
                    })
                  )
                }}
                type="primary"
              >
                Deposit
              </Button>
            ) : (
              <Button
                onClick={() => {
                  dispatch(
                    withdrawEther({
                      exchange,
                      amount: state.etherValue,
                      web3,
                      account
                    })
                  )
                }}
                type="primary"
              >
                Withdraw
              </Button>
            )}
          </Col>
        </Row>

        <Row gutter={20} style={{ marginTop: 10 }}>
          <Col span={10}>
            <Input
              value={state.tokenValue}
              placeholder="Token amount"
              onChange={e =>
                setState({
                  ...state,
                  tokenValue: e.target.value
                })
              }
            />
          </Col>
          <Col span={6}>
            {state.activeKey === 'Deposit' ? (
              <Button
                onClick={() => {
                  dispatch(
                    depositToken({
                      exchange,
                      token,
                      amount: state.tokenValue,
                      web3,
                      account
                    })
                  )
                }}
                type="primary"
              >
                Deposit
              </Button>
            ) : (
              <Button
                onClick={() => {
                  dispatch(
                    withdrawToken({
                      exchange,
                      token,
                      amount: state.tokenValue,
                      web3,
                      account
                    })
                  )
                }}
                type="primary"
              >
                Withdraw
              </Button>
            )}
          </Col>
        </Row>
      </Spin>
    </Card>
  )
}

export default Balance
