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

  it("check rights match deployment input", async function () {
    const rights = await Business.rights();

    expect(rights.isWhitelisted).to.equal(false);
    expect(rights.isLock).to.equal(false);
    expect(rights.isCap).to.equal(false);
  });

  it("check owner match deployment input", async function () {
    const owner = await Business.owner();
    expect(owner).to.equal(Signers[0].address);
  });

  it("mint SFT and pay eth", async function () {
    await Business.mint().catch(function (err) {
      expect(err.message).include("Err_Invalid_Invest_Amount");
    });
    await Business.mint({ value: 10000 });
  });

  it("query users has invested amount", async () => {
    await Business.mint({ value: 10000 });
    await Business.mint({ value: 10000 });
    await Business.mint({ value: 10000 });
    await Business.connect(Signers[1]).mint({ value: 20000 });
    const userInvestInfo = await Business.queryInvestorInfo(Signers[0].address);

    expect(userInvestInfo.investAmount.toNumber()).to.equal(30000);
    expect(userInvestInfo.proportion.toString()).to.equal(
      (6 * 10e17).toString()
    );
  });

  it("query all invest information", async () => {
    await Business.mint({ value: 10000 });
    await Business.mint({ value: 10000 });
    await Business.mint({ value: 10000 });
    await Business.connect(Signers[1]).mint({ value: 20000 });
    // const usersInvestInfo = await Business.allInvestors(0);
    const usersInformation = await Business.connect(
      Signers[0]
    ).queryAllInvestorInfo();

    const user1 = usersInformation[0];
    const user2 = usersInformation[1];

    expect(user1.investor).to.equal(Signers[0].address);
    expect(user1.investAmount.toNumber()).to.equal(30000);
    expect(user1.proportion.toString()).to.equal((6 * 10e17).toString());

    expect(user2.investor).to.equal(Signers[1].address);
    expect(user2.investAmount.toNumber()).to.equal(20000);
    expect(user2.proportion.toString()).to.equal((4 * 10e17).toString());
  });

  it("admin can control withdraw amount and receiver", async () => {
    await Signers[0].sendTransaction({
      to: Business.address,
      value: 100000,
    });

    const bSignerBal = await Signers[0].getBalance();

    await Business.connect(Signers[1])
      .withdraw(Signers[0].address, 10000)
      .catch(function (err) {
        expect(err.message).include("Ownable: caller is not the owner");
      });

    const gasUsed = await calGasUsed(
      Business.connect(Signers[0]).withdraw,
      Signers[0].address,
      10000
    );
    const aSignerBal = await Signers[0].getBalance();
    await expect(aSignerBal.sub(bSignerBal).add(gasUsed)).to.equal(10000);
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
  });
});
