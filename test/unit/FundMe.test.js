const { assert, expect } = require("chai");
const { deployments, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
        let fundMe;
        let deployer;
        let mockV3aggregator;
        const sendValue = ethers.utils.parseEther("1");
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            fundMe = await ethers.getContract("FundMe", deployer);
            mockV3aggregator = await ethers.getContract("MockV3Aggregator", deployer); 
        })


        describe("constructor", async function () {
            it("should set aggregator address correctly", async function() {
                const response = await fundMe.priceFeed();
                assert.equal(response, mockV3aggregator.address);
            })
        })

        describe("fund", async function () {
            it("should fail if not enough eth is send", async function () {
                await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!");
            })

            it("should update the amounFunded data structure", async function () {
                await fundMe.fund({value: sendValue});
                const response = await fundMe.addressToAmountFunded(deployer);
                assert.equal(response.toString(), sendValue.toString());
            })

            it("should update funders array", async function () {
                await fundMe.fund({value: sendValue});
                const funder = await fundMe.funders(0);
                assert.equal(funder, deployer);
            })
        })

        describe("Withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({value: sendValue});
            })

            it("should withdraw eth from a user", async function () {
                const startingContractBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.withdraw();
                const trascationReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = trascationReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingContractBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

                assert.equal(endingContractBalance, 0);
                assert.equal(
                    startingContractBalance.add(startingDeployerBalance.toString()),
                    endingDeployerBalance.add(gasCost).toString()
                )
            })

            it("is allows us to withdraw with multiple funders", async () => {
                // Arrange
                const accounts = await ethers.getSigners()
                for (i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance =
                    await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                // Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)
                // Assert
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(withdrawGasCost).toString()
                )

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.addressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })

            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                await expect(
                    fundMeConnectedContract.withdraw()
                ).to.be.revertedWith("FundMe__NotOwner")
            })


            it("cheaper withdraw testing...", async () => {
                // Arrange
                const accounts = await ethers.getSigners()
                for (i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance =
                    await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                // Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)
                // Assert
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(withdrawGasCost).toString()
                )

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.addressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })
        })
    })