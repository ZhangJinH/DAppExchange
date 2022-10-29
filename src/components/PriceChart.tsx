import { Card, Spin } from 'antd'
import { ApexOptions } from 'apexcharts'
import ReactApexCharts from 'react-apexcharts'
import { useAppSelector } from '../app/hooks'
import {
  priceChartGetters,
  priceChartLoadedGetters
} from '../features/web3/web3Slice'
import { chartOptions } from './price-chart.config'

const priceSymbol = (lastPriceChange: string) => {
  let output
  if (lastPriceChange === '+') {
    output = <span className="green">&#9650;</span>
  } else {
    output = <span className="red">&#9660;</span>
  }
  return output
}

const PriceChart: React.FC = () => {
  const priceChartLoaded = useAppSelector(priceChartLoadedGetters)
  const priceChart: {
    series: unknown
    lastPrice: string
    lastPriceChange: string
  } = useAppSelector(priceChartGetters)

  console.log(priceChart)

  return (
    <Card
      style={{ flex: 1, width: '100%', overflowY: 'scroll' }}
      title="PriceChart"
    >
      <Spin spinning={!priceChartLoaded}>
        <div>
          DApp/ETH &nbsp; {priceSymbol(priceChart.lastPriceChange)} &nbsp;{' '}
          {priceChart.lastPrice}
        </div>
        <ReactApexCharts
          options={chartOptions}
          series={priceChart.series as ApexOptions['series']}
          type="candlestick"
          width="100%"
          height="250px"
        ></ReactApexCharts>
      </Spin>
    </Card>
  )
}

export default PriceChart
