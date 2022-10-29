require('dotenv').config()
const HDWalletProvider = require('truffle-hdwallet-provider')

const privateKeys = process.env.PRIVATE_KEYS || ''
const infuraApiKey = process.env.INFURA_API_KEY

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '*' // Any network (default: none)
    },
    goerli: {
      networkCheckTimeout: 60000, // 超过 1min 则提示超时
      provider: function () {
        return new HDWalletProvider(
          privateKeys.split(','),
          `https://goerli.infura.io/v3/${infuraApiKey}`
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 3
    }
  },

  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: '0.8.17', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
