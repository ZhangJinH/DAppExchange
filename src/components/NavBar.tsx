import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { useAppSelector } from '../app/hooks'
import { accountGetters } from '../features/web3/web3Slice'

const menuList: MenuProps['items'] = [
  // {
  //   label: 'Link1',
  //   key: '1',
  // },
  // {
  //   label: 'Link2',
  //   key: '2',
  // },
  // {
  //   label: 'Link3',
  //   key: '3',
  // },
]

const NavBar: React.FC = () => {
  const account = useAppSelector(accountGetters)

  return (
    <>
      <div style={{ width: '120px', color: '#fff' }}>DApp交易所</div>
      <Menu
        style={{ flex: 1 }}
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['1']}
        items={menuList}
      />
      <div style={{ color: '#fff' }}>{account}</div>
    </>
  )
}

export default NavBar
