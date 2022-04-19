const hre = require("hardhat");

async function main() {
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(1);

  await nft.deployed();
  await marketplace.deployed();

  console.log("NFT deployed to:", nft.address);
  console.log("Marketplace deployed to:", marketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
