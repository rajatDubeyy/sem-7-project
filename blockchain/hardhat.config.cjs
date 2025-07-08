require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    holesky: {
      url: process.env.HOLESKY_URL,
      accounts: [process.env.SECRET_KEY],
      chainId: 17000,
    }
  },
};
