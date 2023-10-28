const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const FactoryDeploy = require("./deploy/factory");
const { ethers } = require("hardhat");

describe("factory to create business", function () {
  let Factory;
  let FactoryAddr;
  let Platform;
  let PlatformAddr;
  let Signers;

  beforeEach(async () => {
    Factory = await FactoryDeploy();
    FactoryAddr = Factory.address;

    Signers = await ethers.getSigners();
  });

  it("new business", async () => {
    const addr = await Factory.callStatic.newBusiness(false, false, false);

    await Factory.newBusiness(false, false, false);

    const bool = await Factory.isBusiness(addr);
    expect(bool).to.equal(true);
  });
});
