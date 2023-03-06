const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("funding contract...");
    const transactionResponse = fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    });
    await transactionResponse;
    console.log("funded!")
}


main ()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e);
        process.exit(1);
    })