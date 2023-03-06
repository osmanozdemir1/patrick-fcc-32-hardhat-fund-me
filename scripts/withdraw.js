const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("withdrawing...");
    const transactionResponse = fundMe.withdraw();
    await transactionResponse;
    console.log("it's back!")
}


main ()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e);
        process.exit(1);
    })