import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";

export default function Profile () {

    const sampleLoan = {
        loanAmount : 0,
        interestRate : 0,
         duration : 0,
        loanId : -1,
         collateralAmount : 0,
        tokenId : 0,
        active : false,
        amountOwed: 0
    }
    const [data, updateData] = useState([]);
    const [loanData, updateLoanData] = useState(sampleLoan);
    const [loanFetched, updateLoanFetched] = useState(false);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");
    const [message, updateMessage] = useState("");

    async function disableButton(btnName) {
        const listButton = document.getElementById(btnName)
        listButton.disabled = true
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }
    
    async function enableButton(btnName) {
        const listButton = document.getElementById(btnName)
        listButton.disabled = false
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    async function getLoanData() {
        console.log("in loan data")
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

        try{

            let transaction = await contract.getAllMyLoans();
            console.log("GET LOANS: " + transaction)

            let loan = {
                loanAmount : transaction[0].toNumber(),
                interestRate : transaction[1].toNumber(),
                 duration : transaction[2].toNumber(),
                loanId : transaction[3].toNumber(),
                 collateralAmount : transaction[5].toNumber(),
                tokenId : transaction[6].toNumber(),
                active : transaction[7],
                amountOwed: transaction[8].toNumber()
           }

            updateLoanData(loan)
            updateLoanFetched(true)

        } catch(error) {
            
        }

    }

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        let sumPrice = 0;
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        //create an NFT Token
        let transaction = await contract.getMyNFTs()

        /*
        * Below function takes the metadata from tokenURI and the data returned by getMyNFTs() contract function
        * and creates an object of information that is to be displayed
        */
        
        try{
            const items = await Promise.all(transaction.map(async i => {
                const tokenURI = await contract.tokenURI(i.tokenId);
                let meta = await axios.get(tokenURI);
                meta = meta.data;
                console.log("Hello" + i.fnftPrice.toString());
                let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
                let item = {
                    price,
                    tokenId: i.tokenId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.image,
                    name: meta.name,
                    description: meta.description,
                    fractionalise: i.fractionalise,
                    fractionalisePrice: i.fnftPrice.toNumber(),
                    fractionaliseQty: i.amount.toNumber(),
                    loanActive: i.loanActive
                }
                sumPrice += Number(price);
                return item;
            }))
    
            updateData(items);
            updateFetched(true);
            updateAddress(addr);
            updateTotalPrice(sumPrice.toPrecision(3));
        } catch(error) {
            console.log(error)
        }
       
    }

    async function getFractionaliseContract() {

        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
    
        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        return contract;
      }
    

    async function repayLoan() {
        const contract1 = await getFractionaliseContract();
        updateMessage("Repaying the laon... Please Wait (Upto 5 mins)")
        disableButton("repay-btn");
    
        try{
            console.log("loanData.collateralAmount " + loanData.collateralAmount)
            console.log("loanData.loanId " + loanData.loanId)

            var test = await contract1.repayLoan(loanData.loanId, {value: loanData.amountOwed});
            await test.wait();
            alert('You successfully repaid the Loan!');
            window.location.reload(false);
        } catch (error) {
            alert(error);
        }
        updateMessage("");
        enableButton("repay-btn");
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);
    
    if(!loanFetched)
        getLoanData();

    return (
        <div className="profileClass" style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} 
                    </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length == 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>

            <div className="flex flex-col text-center items-center mt-11 text-white">
            <h2 className="font-bold">My Loans</h2>
            </div>

            <div className="flex ml-20 mt-20">
                {
                    loanData.loanId > 0? 
                    <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Loan Id: {loanData.loanId}
                    </div>
                    <div>
                        Loan Taken Amount : {loanData.collateralAmount} Wei
                    </div>
                    <div>
                        Loan Repayment Amount : {loanData.amountOwed} Wei
                    </div>
                    <div>
                        Loan Duration : {loanData.duration} Days
                    </div>
                    <div> 

                    { loanData.active?
                       <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" id="repay-btn" onClick={() => repayLoan()}>Repay Loan</button>
                       : <div>Loan Repaid</div>
                    }            
                        <div className="text-red-500 text-center mt-3">{message}</div>
                    </div>
                </div> : 
                <div className="mt-10 text-xl">
                    No active Loans !!!        
                </div>}
            </div>
            </div>
        </div>
    )
};