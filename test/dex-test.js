const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const pair_abi = require('../artifacts/contracts/core/TuitionPair.sol/TuitionPair.json').abi;

// deadline
const deadline = 100;      //7 * 24 * 60 * 60
const MINIMUM_LIQUIDITY = BigNumber.from("1000");
//

let router;
let factory;
let WETH;
let WETHPartner;
let token0;
let token1;
let pair;
let WETHPair;

// signers
let owner, addr1;

describe('TUITION Dex', () => {
    beforeEach(async function() {
        [owner , addr1] = await ethers.getSigners();
        // ERC token contract deploy
        const Token0 = await ethers.getContractFactory("ERC20");
        const Token1 = await ethers.getContractFactory("ERC20");
        const WETH9 = await ethers.getContractFactory("WETH9");
        const ethPartner = await ethers.getContractFactory("ERC20");

        token0 = await Token0.deploy( ethers.utils.parseEther("10000") );
        token1 = await Token1.deploy( ethers.utils.parseEther("10000") );
        WETH = await WETH9.deploy();
        WETHPartner = await ethPartner.deploy( ethers.utils.parseEther("10000") );

        // Tuition Factory contract deploy
        const Factory = await ethers.getContractFactory("TuitionFactory");

        factory = await Factory.deploy( owner.address );
        
        // Tuition Router contract deploy
        const Router = await ethers.getContractFactory("TuitionRouter");
        router = await Router.deploy( factory.address, WETH.address );

        // create pair contract with token0 and token1 
        const pair_addr = await factory.callStatic.createPair(token0.address , token1.address);
        const Pair = await ethers.getContractFactory("TuitionPair");
        pair = await Pair.attach(pair_addr);

        // create pair contract with WETH and WETHPartner
        const eth_pair_addr = await factory.callStatic.createPair(WETH.address , WETHPartner.address);
        const ETHPair = await ethers.getContractFactory("TuitionPair");
        WETHPair = await ETHPair.attach(eth_pair_addr);
        // const WETHPair = new ethers.Contract(pair_addr, pair_abi, owner);

        // apporve ethers MaxUints of token 0 and 1
        await token0.approve( router.address , ethers.constants.MaxUint256 );
        await token1.approve( router.address , ethers.constants.MaxUint256 );

        await WETHPartner.approve(router.address, ethers.constants.MaxUint256);
    })

    describe('UniswapV2Router', () => {
        it('factory WETH', async () => {
            expect(await router.factory()).to.eq(factory.address)
            expect(await router.WETH()).to.eq(WETH.address)

            console.log("factory hash code", await factory.INIT_CODE_PAIR_HASH());
            console.log("token0 address", token0.address);
            console.log("token1 address", token1.address);
        })

        // it('addLiquidity', async () => {
        //     const token0Amount = ethers.utils.parseEther("1.0")
        //     const token1Amount = ethers.utils.parseEther("4")

        //     const expectedLiquidity = ethers.utils.parseEther("2")
            
        //     // get current block timestamp 
        //     let curBlockNum = await ethers.provider.getBlockNumber();
        //     let block = await ethers.provider.getBlock(curBlockNum);
        //     let curTime = block.timestamp;

        //     await expect(
        //         router.addLiquidity(
        //             token0.address,
        //             token1.address,
        //             token0Amount,
        //             token1Amount,
        //             0,
        //             0,
        //             owner.address,  
        //             curTime + deadline
        //         )
        //     )
        //     .to.emit(token0 , 'Transfer')
        //     .withArgs(owner.address , pair.address, token0Amount)
        //     .to.emit(token1, 'Transfer')
        //     .withArgs(owner.address , pair.address, token1Amount)
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , ethers.constants.AddressZero , MINIMUM_LIQUIDITY)
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //     // .to.emit(pair, 'Sync')                  // fix change position from token0 to token1
        //     // .withArgs(token1Amount, token0Amount)
        //     // .to.emit(pair, 'Mint')
        //     // .withArgs(router.address, token1Amount ,token0Amount)
            
        //     expect( await pair.balanceOf(owner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        // })

        // it('addLiquidityETH', async () => {
        //     const WETHPartnerAmount = ethers.utils.parseEther("4");
        //     const ETHAmount = ethers.utils.parseEther("1");
            
        //     const expectedLiquidity = ethers.utils.parseEther("2");
            
        //     // get current block timestamp 
        //     curBlockNum = await ethers.provider.getBlockNumber();
        //     block = await ethers.provider.getBlock(curBlockNum);
        //     curTime = block.timestamp;
            
        //     await expect(
        //         router.addLiquidityETH(
        //             WETHPartner.address,
        //             WETHPartnerAmount,
        //             WETHPartnerAmount,
        //             ETHAmount,
        //             owner.address,
        //             curTime + deadline,
        //             {
        //                 value: ETHAmount,
        //             }
        //         )
        //     )
        //     .to.emit(WETHPair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, MINIMUM_LIQUIDITY)
        //     .to.emit(WETHPair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero, owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //     // .to.emit(WETHPair, 'Sync')
        //     // .withArgs(
        //     //     WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        //     //     WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
        //     // )
        //     // .to.emit(WETHPair, 'Mint')
        //     // .withArgs(
        //     //     router.address,
        //     //     WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        //     //     WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
        //     // )
        // })

        // async function addLiquidity(token0Amount, token1Amount, expectedLiquidity){
        //     await expect(
        //         token0.transfer(pair.address, token0Amount)
        //     )
        //     .to.emit(token0, 'Transfer')
        //     .withArgs(owner.address , pair.address, token0Amount)

        //     await expect(
        //         token1.transfer(pair.address, token1Amount)
        //     )
        //     .to.emit(token1, 'Transfer')
        //     .withArgs(owner.address , pair.address, token1Amount)

        //     await expect(
        //         pair.mint(owner.address)
        //     )
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , ethers.constants.AddressZero , MINIMUM_LIQUIDITY + 9999999)
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        // }

        // it('removeLiquidity', async () => {
        //     const token0Amount = ethers.utils.parseEther("1");
        //     const token1Amount = ethers.utils.parseEther("4");
        //     const expectedLiquidity = ethers.utils.parseEther("2")

        //     // addLiquidity(token0Amount, token1Amount, expectedLiquidity);
            
        //     // add Liquidity into pair contract
        //     // get current block timestamp 
        //     let curBlockNum = await ethers.provider.getBlockNumber();
        //     let block = await ethers.provider.getBlock(curBlockNum);
        //     let curTime = block.timestamp;

        //     await expect(
        //         router.addLiquidity(
        //             token0.address,
        //             token1.address,
        //             token0Amount,
        //             token1Amount,
        //             0,
        //             0,
        //             owner.address,  
        //             curTime + deadline
        //         )
        //     )
        //     .to.emit(token0 , 'Transfer')
        //     .withArgs(owner.address , pair.address, token0Amount)
        //     .to.emit(token1, 'Transfer')
        //     .withArgs(owner.address , pair.address, token1Amount)
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , ethers.constants.AddressZero , MINIMUM_LIQUIDITY)
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(ethers.constants.AddressZero , owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))

        //     // remove Liquidity from pair contract
        //     await pair.approve(router.address, ethers.constants.MaxUint256);

        //     await expect(
        //         router.removeLiquidity(
        //             token0.address,
        //             token1.address,
        //             expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        //             0,
        //             0,
        //             owner.address,
        //             ethers.constants.MaxUint256
        //         )
        //     )
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(owner.address, pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //     .to.emit(pair, 'Transfer')
        //     .withArgs(pair.address, ethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //     .to.emit(token0, 'Transfer')
        //     .withArgs(pair.address, owner.address, token0Amount.sub(500))
        //     .to.emit(token1, 'Transfer')
        //     .withArgs(pair.address, owner.address, token1Amount.sub(2000))
        //     // .to.emit(pair, 'Sync')
        //     // .withArgs(500, 2000)
        //     // .to.emit(pair, 'Burn')
        //     // .withArgs(router.address, token0Amount.sub(500), token1Amount.sub(2000), owner.address)

        //     expect(await pair.balanceOf(owner.address)).to.eq(0)
        //     const totalSupplyToken0 = await token0.totalSupply()
        //     const totalSupplyToken1 = await token1.totalSupply()
        //     expect(await token0.balanceOf(owner.address)).to.eq(totalSupplyToken0.sub(500))
        //     expect(await token1.balanceOf(owner.address)).to.eq(totalSupplyToken1.sub(2000))

        // })

        it('removeLiquiidtyETH', async () => {
            const WETHPartnerAmount = ethers.utils.parseEther('1');
            const ETHAmount = ethers.utils.parseEther('4');
            const expectedLiquidity = ethers.utils.parseEther('2');
            // await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
            // await WETH.deposit({value: ETHAmount})
            // await WETH.transfer(WETHPair.address, ETHAmount)
            // await WETHPair.mint(owner.address)

            // add Liquidity ETH
            // get current block timestamp 
            curBlockNum = await ethers.provider.getBlockNumber();
            block = await ethers.provider.getBlock(curBlockNum);
            curTime = block.timestamp;
            
            await expect(
                router.addLiquidityETH(
                    WETHPartner.address,
                    WETHPartnerAmount,
                    WETHPartnerAmount,
                    ETHAmount,
                    owner.address,
                    curTime + deadline,
                    {
                        value: ETHAmount,
                    }
                )
            )
            .to.emit(WETHPair, 'Transfer')
            .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, MINIMUM_LIQUIDITY)
            .to.emit(WETHPair, 'Transfer')
            .withArgs(ethers.constants.AddressZero, owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))

            // remove liquidity ETH
            await WETHPair.approve(router.address, ethers.constants.MaxUint256)

            await expect(
                router.removeLiquidityETH(
                    WETHPartner.address,
                    expectedLiquidity.sub(MINIMUM_LIQUIDITY),
                    0,
                    0,
                    owner.address,
                    ethers.constants.MaxUint256
                )
            )
            .to.emit(WETHPair, 'Transfer')
            .withArgs(owner.address, WETHPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(WETHPair, 'Transfer')
            .withArgs(WETHPair.address, ethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(WETH, 'Transfer')
            .withArgs(WETHPair.address, router.address, ETHAmount.sub(2000))
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(WETHPair.address, router.address, WETHPartnerAmount.sub(500))
            .to.emit(WETHPartner, 'Transfer')
            .withArgs(router.address, owner.address, WETHPartnerAmount.sub(500))
            // .to.emit(WETHPair, 'Sync')
            // .withArgs(
            //     WETHPairToken0 === WETHPartner.address ? 500 : 2000,
            //     WETHPairToken0 === WETHPartner.address ? 2000 : 500
            // )
            // .to.emit(WETHPair, 'Burn')
            // .withArgs(
            //     router.address,
            //     WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.sub(500) : ETHAmount.sub(2000),
            //     WETHPairToken0 === WETHPartner.address ? ETHAmount.sub(2000) : WETHPartnerAmount.sub(500),
            //     router.address
            // )
        })

        // it('removeLiquidityWithPermit', async () => {})

        // it('removeLiquidityETHWithPermit', async () => {})

        // describe('swapExactTokensForTokens', () => {
        //     const token0Amount = ethers.utils.parseEther('5')
        //     const token1Amount = ethers.utils.parseEther('10')
        //     beforeEach(async () => {    // add Liquidity
        //         // get current block timestamp 
        //         let curBlockNum = await ethers.provider.getBlockNumber();
        //         let block = await ethers.provider.getBlock(curBlockNum);
        //         let curTime = block.timestamp;

        //         await expect(
        //             router.addLiquidity(
        //                 token0.address,
        //                 token1.address,
        //                 token0Amount,
        //                 token1Amount,
        //                 0,
        //                 0,
        //                 owner.address,  
        //                 curTime + deadline
        //             )
        //         )
        //         .to.emit(token0 , 'Transfer')
        //         .withArgs(owner.address , pair.address, token0Amount)
        //         .to.emit(token1, 'Transfer')
        //         .withArgs(owner.address , pair.address, token1Amount)
        //         // .to.emit(pair, 'Transfer')
        //         // .withArgs(ethers.constants.AddressZero , ethers.constants.AddressZero , MINIMUM_LIQUIDITY)
        //         // .to.emit(pair, 'Transfer')
        //         // .withArgs(ethers.constants.AddressZero , owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //         await token0.approve(router.address, ethers.constants.MaxUint256);
        //     })

        //     it('happy path', async () => {
        //         const swapAmount = ethers.utils.parseEther('1')
        //         const expectedOutputAmount = BigNumber.from('1662497915624478906');
        //         await expect(
        //             router.swapExactTokensForTokens(
        //                 swapAmount,
        //                 0,
        //                 [token0.address, token1.address],
        //                 owner.address,
        //                 ethers.constants.MaxUint256,
        //             )
        //         )
        //         .to.emit(token0, 'Transfer')
        //         .withArgs(owner.address, pair.address, swapAmount)
        //         // .to.emit(token1, 'Transfer')
        //         // .withArgs(pair.address, owner.address, expectedOutputAmount)
        //         // .to.emit(pair, 'Sync')
        //         // .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
        //         // .to.emit(pair, 'Swap')
        //         // .withArgs(router.address, swapAmount, 0, 0, expectedOutputAmount, owner.address)

        //         // difference between 1662497915624478906,  1663887962654218072 
        //     })

        // })

        // describe('swapTokensForExactToken', async () => {
        //     const token0Amount = ethers.utils.parseEther('5')
        //     const token1Amount = ethers.utils.parseEther('10')

        //     beforeEach(async () => {    // add Liquidity
        //         // get current block timestamp 
        //         let curBlockNum = await ethers.provider.getBlockNumber();
        //         let block = await ethers.provider.getBlock(curBlockNum);
        //         let curTime = block.timestamp;

        //         await expect(
        //             router.addLiquidity(
        //                 token0.address,
        //                 token1.address,
        //                 token0Amount,
        //                 token1Amount,
        //                 0,
        //                 0,
        //                 owner.address,  
        //                 curTime + deadline
        //             )
        //         )
        //         .to.emit(token0 , 'Transfer')
        //         .withArgs(owner.address , pair.address, token0Amount)
        //         .to.emit(token1, 'Transfer')
        //         .withArgs(owner.address , pair.address, token1Amount)
        //         // .to.emit(pair, 'Transfer')
        //         // .withArgs(ethers.constants.AddressZero , ethers.constants.AddressZero , MINIMUM_LIQUIDITY)
        //         // .to.emit(pair, 'Transfer')
        //         // .withArgs(ethers.constants.AddressZero , owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        //         await token0.approve(router.address, ethers.constants.MaxUint256);
        //     })

        //     it('happy path', async () => {
        //         const expectedSwapAmount = BigNumber.from('556668893342240036')
        //         const outputAmount = ethers.utils.parseEther('1')
        //         await token0.approve(router.address, ethers.constants.MaxUint256)

        //         await expect(
        //             router.swapTokensForExactTokens(
        //                 outputAmount,
        //                 ethers.constants.MaxUint256,
        //                 [token0.address, token1.address],
        //                 owner.address,
        //                 ethers.constants.MaxUint256,
        //             )
        //         )
        //         .to.emit(token0, 'Transfer')
        //         .withArgs(owner.address, pair.address, expectedSwapAmount)
        //         // .to.emit(token1, 'Transfer')
        //         // .withArgs(pair.address, owner.address, outputAmount)
        //         // .to.emit(pair, 'Sync')
        //         // .withArgs(token0Amount.add(expectedSwapAmount), token1Amount.sub(outputAmount))
        //         // .to.emit(pair, 'Swap')
        //         // .withArgs(router.address, expectedSwapAmount, 0, 0, outputAmount, owner.address)
        //     })
        // })
    })
})