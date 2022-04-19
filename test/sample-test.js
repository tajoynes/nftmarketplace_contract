const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {
  let deployer, addr1, addr2, nft, marketplace;
  let feePercent = 1;
  let URI = "Sample URI";
  beforeEach(async function () {
    const NFT = await ethers.getContractFactory("NFT");
    const Marketplace = await ethers.getContractFactory("Marketplace");

    [deployer, addr1, addr2] = await ethers.getSigners();

    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });
  describe("Deployment", function () {
    it("Should return name and symbol of deployed NFT collection", async function () {
      expect(await nft.name()).to.equal("SCVNGR HNT");
      expect(await nft.symbol()).to.equal("SCVT");
    });
    it("Should return feeAccount and feePercent", async function () {
      expect(await marketplace.feeManagerAcct()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });
  describe("Mint an NFT", function () {
    it("Should return each minted NFT", async function () {
      await nft.connect(addr1).mint(URI);
      expect(await nft.tokenURI(1)).to.equal(URI);

      await nft.connect(addr2).mint(URI);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });
  describe("Create marketplace items", function () {
    beforeEach(async function () {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });
    it("Return newly created items and transfer NFT from seller to marketplace and emit Offered event", async function () {
      await expect(
        marketplace.connect(addr1).createItem(nft.address, 1, toWei(1))
      )
        .to.emit(marketplace, "Offered")
        .withArgs(1, nft.address, 1, toWei(1), addr1.address);
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await marketplace.itemCount()).to.equal(1);

      const item = await marketplace.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(1));
      expect(item.sold).to.equal(false);
    });
    it("Return fail if price is set to zero", async function () {
      await expect(
        marketplace.connect(addr1).createItem(nft.address, 1, 0)
      ).to.be.revertedWith("Please list price greater than zero");
    });
  });
  describe("Purchase marketplace items", function () {
    let price = 2;
    let totalWeiPrice;
    beforeEach(async function () {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(addr1).createItem(nft.address, 1, toWei(price));
    });
    it("Return item as being sold, pay seller, transfer NFT, emit Bought event", async function () {
      const sellerInitialBal = await addr1.getBalance();
      const feeAcctInitialBal = await deployer.getBalance();

      totalWeiPrice = await marketplace.getTotalCost(1);

      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: totalWeiPrice })
      )
        .to.emit(marketplace, "Bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        );
      const sellerFinalBal = await addr1.getBalance();
      const feeAcctFinalBal = await deployer.getBalance();

      expect(+fromWei(sellerFinalBal)).to.equal(
        +price + +fromWei(sellerInitialBal)
      );

      const fee = (feePercent / 100) * price;

      expect(+fromWei(feeAcctFinalBal)).to.equal(
        +fee + +fromWei(feeAcctInitialBal)
      );

      expect(await nft.ownerOf(1)).to.equal(addr2.address);

      expect((await marketplace.items(1)).sold).to.equal(true);
    });
    it("Check require functions for invalid parameters", async function () {
      await expect(
        marketplace.connect(addr2).purchaseItem(2, { value: totalWeiPrice })
      ).to.be.revertedWith("That item doesn't exits");
      await expect(
        marketplace.connect(addr2).purchaseItem(0, { value: totalWeiPrice })
      ).to.be.revertedWith("That item doesn't exits");
      await expect(
        marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
      ).to.be.revertedWith("Amount is not enough to cover total cost");
      await marketplace
        .connect(addr2)
        .purchaseItem(1, { value: totalWeiPrice });
      await expect(
        marketplace.connect(deployer).purchaseItem(1, { value: totalWeiPrice })
      ).to.be.revertedWith("Item has already been sold");
    });
  });
});
