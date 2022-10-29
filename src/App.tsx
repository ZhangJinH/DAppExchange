import { Layout } from 'antd'
import React, { useEffect } from 'react'
import './App.less'
import { useAppDispatch, useAppSelector } from './app/hooks'
import NavBar from './components/NavBar'
import LayoutContent from './components/Content'
import {
  contractLoadedGetters,
  exchangeGetters,
  loadWeb3,
  web3Getters
} from './features/web3/web3Slice'
import { loadAccount, loadExchange, loadToken } from './features/web3/web3API'

const { Header, Content } = Layout

const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const connection = useAppSelector(web3Getters)
  const contractLoaded = useAppSelector(contractLoadedGetters)

  useEffect(() => {
    dispatch(loadWeb3())
  }, [dispatch])
  useEffect(() => {
    if (connection) {
      dispatch(loadAccount(connection))
      dispatch(loadToken(connection))
      dispatch(loadExchange(connection))
    }
  }, [dispatch, connection])

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex' }}>
        <NavBar />
      </Header>
      <Content>{contractLoaded && <LayoutContent />}</Content>
    </Layout>
  )
}

export default App
