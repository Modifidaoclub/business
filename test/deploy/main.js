const hre = require("hardhat");
const ethers = hre.ethers;

async function main(isWhitelisted_ = false, isLock_ = false, isCap_ = false) {
  const Business = await ethers.getContractFactory("Business");
  const BusinessInstance = await Business.deploy(
    isWhitelisted_,
    isLock_,
    isCap_
  );

  await BusinessInstance.deployed();

  return BusinessInstance;
}

module.exports = main;
