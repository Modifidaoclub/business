const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const BusinessDeploy = require("./deploy/main.js");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

const calGasUsed = require("./utils/calGasUsed.js");

describe("business", function (accounts) {
  let Business;
  let BusinessAddr;
  let Signers;

  beforeEach(async () => {
    Business = await BusinessDeploy(false, false, false);

    BusinessAddr = Business.address;
    Signers = await ethers.getSigners();
  });

  it("investors should be received tokens match shares", async () => {
    await Business.mint({ value: 30000 });
    await Business.connect(Signers[1]).mint({ value: 20000 });
    await Business.connect(Signers[2]).mint({ value: 50000 });

    await Signers[0].sendTransaction({
      to: Business.address,
      value: 100,
    });

    await Business.connect(Signers[1])
      .bonus(100)
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    // user0
    const b0SignerBal = await Signers[0].getBalance();
    // user1
    const b1SignerBal = await Signers[1].getBalance();
    // user2
    const b2SignerBal = await Signers[2].getBalance();

    const gasCost = await calGasUsed(Business.bonus, 100);
    // user0
    const a0SignerBal = await Signers[0].getBalance();
    // user1
    const a1SignerBal = await Signers[1].getBalance();
    // user2
    const a2SignerBal = await Signers[2].getBalance();

    expect(a0SignerBal.sub(b0SignerBal).add(gasCost)).to.equal(30);
    expect(a1SignerBal.sub(b1SignerBal)).to.equal(20);
    expect(a2SignerBal.sub(b2SignerBal)).to.equal(50);

    // await Business['transferFrom(uint256,address,uint256)'](3, Signers[1].address, 180);

    // // user0
    // const b0SignerBal2 = await Signers[0].getBalance();
    // // user1
    // const b1SignerBal2 = await Signers[1].getBalance();
    // // user2
    // const b2SignerBal2 = await Signers[2].getBalance();

    // const gasCost2 = await calGasUsed(Business.bonus, 100);
    // // user0
    // const a0SignerBal2 = await Signers[0].getBalance();
    // // user1
    // const a1SignerBal2 = await Signers[1].getBalance();
    // // user2
    // const a2SignerBal2 = await Signers[2].getBalance();

    // expect(a0SignerBal2.sub(b0SignerBal2).add(gasCost2)).to.equal(60);
    // expect(a1SignerBal2.sub(b1SignerBal2)).to.equal(20);
    // expect(a2SignerBal2.sub(b2SignerBal2)).to.equal(20);
  });
});
