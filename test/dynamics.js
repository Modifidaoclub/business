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

describe("business dynamics", function (accounts) {
  let Business;
  let BusinessAddr;
  let Signers;

  it("dynamics has added whitelist could invest", async function () {
    Business = await BusinessDeploy(true, false, false);
    BusinessAddr = Business.address;
    Signers = await ethers.getSigners();
    const rights = await Business.rights();
    expect(rights.isWhitelisted).to.equal(true);
    expect(rights.isLock).to.equal(false);
    expect(rights.isCap).to.equal(false);

    await Business.connect(Signers[1])
      .setWhiteCanInverstAmouts(
        [Signers[1].address, Signers[2].address],
        [1000, 2000]
      )
      .catch((e) => {
        expect(e.message).include("Ownable: caller is not the owner");
      });

    await Business.connect(Signers[0])
      .setWhiteCanInverstAmouts(
        [Signers[1].address, Signers[2].address, Signers[3].address],
        [1000, 2000]
      )
      .catch((e) => {
        expect(e.message).include("Err_Length_Not_Equal");
      });

    await Business.setWhiteCanInverstAmouts(
      [Signers[1].address, Signers[2].address, Signers[3].address],
      [1000, 2000, 3000]
    );

    await Business.connect(Signers[1]).mint({ value: 1000 });
    await Business.connect(Signers[2]).mint({ value: 2000 });
    await Business.connect(Signers[3]).mint({ value: 2000 });
    await Business.connect(Signers[3]).mint({ value: 1000 });
    // await Business.connect(Signers[3]).mint({ value: 1 });
    // await Business.connect(Signers[4]).mint({ value: 1000 });
  });

  it("dynamics isLock to control sell time", async function () {
    Business = await BusinessDeploy(false, true, false);
    BusinessAddr = Business.address;
    Signers = await ethers.getSigners();
    const rights = await Business.rights();
    expect(rights.isWhitelisted).to.equal(false);
    expect(rights.isLock).to.equal(true);
    expect(rights.isCap).to.equal(false);

    await Business.mint({ value: 1000 }).catch((e) => {
      expect(e.message).include("Err_Project_Locked");
    });

    await Business.connect(Signers[1])
      .setRightsIsLock(false)
      .catch((e) => {
        expect(e.message).include("Ownable: caller is not the owner");
      });
    await Business.setRightsIsLock(false);

    await Business.mint({ value: 1000 });
  });

  it("dynamics invest cap to control buy maximum", async function () {
    Business = await BusinessDeploy(false, false, true);
    BusinessAddr = Business.address;
    Signers = await ethers.getSigners();
    const rights = await Business.rights();
    expect(rights.isWhitelisted).to.equal(false);
    expect(rights.isLock).to.equal(false);
    expect(rights.isCap).to.equal(true);

    await Business.connect(Signers[1])
      .setProjectInvestCap(1000)
      .catch((e) => {
        expect(e.message).include("Ownable: caller is not the owner");
      });
    await Business.setProjectInvestCap(1000);

    // await Business.mint({ value: 10000 }).catch((e) => {
    //   expect(e.message).include("Err_Project_Overflow_Cap");
    // });
    await Business.mint({ value: 500 });
    await Business.connect(Signers[1]).mint({ value: 500 });
    await Business.connect(Signers[2])
      .mint({ value: 1 })
      .catch((e) => {
        expect(e.message).include("Err_Project_Overflow_Cap");
      });
  });
});
