import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function NFTPage (props) {

const [data, updateData] = useState({});
const [dataFetched, updateDataFetched] = useState(false);
const [message, updateMessage] = useState("");
const [currAddress, updateCurrAddress] = useState("0x");

async function getNFTData(tokenId) {
    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    var tokenURI = await contract.tokenURI(tokenId);
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    let meta = await axios.get(tokenURI);
    meta = meta.data;
    console.log("LISTED TOKEN");
    console.log(listedToken);

    let item = {
        price: meta.price,
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
        fractionalise: listedToken.fractionalise,
        fractionalisePrice: listedToken.fnftPrice.toNumber(),
        fractionaliseQty: listedToken.amount.toNumber(),
        loanActive: listedToken.loanActive
    }
    console.log(item);
    updateData(item);
    updateDataFetched(true);
    console.log("address", addr)
    updateCurrAddress(addr);
}

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

async function getFractionaliseContract() {

    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    return contract;
  }

async function buyNFT(tokenId) {
    if(data.fractionalise) {
        const ethers = require("ethers");
        
        const amtToSell = document.querySelector("#amtToSell").value;

        if( !amtToSell)
        {
            alert("Please fill all the fields!")
            return -1;
        }
    
        if(amtToSell > data.fractionaliseQty) {
            alert("Buy amount can't be more than the quantity")
            return -1;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")

        console.log(amtToSell + " amtToSell")
        console.log(data.fractionalisePrice + " prce")
        const salePrice = amtToSell * data.fractionalisePrice
        console.log("salePrice" + salePrice)
        //run the executeSale function
        try{
            disableButton("buy-btn")
            let transaction = await contract.nftSell(tokenId, amtToSell, {value:salePrice});
            await transaction.wait();
            alert('You successfully bought the NFT!');
            window.location.reload(false);
        } catch (error) {
            alert(error)
        }
        enableButton("buy-btn")
        updateMessage("");
    } else {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
    
            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether')
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
            //run the executeSale function
            let transaction = await contract.executeSale(tokenId, {value:salePrice});
            await transaction.wait();
    
            alert('You successfully bought the NFT!');
            updateMessage("");
            window.location.reload(false);
        }
        catch(e) {
            alert("Upload Error"+e)
        }
    }
}

async function  fraction (tokenId) {
    
    const contract1 = await getFractionaliseContract();
    const count = document.querySelector("#count").value;
    const price = document.querySelector("#price").value;

    if( !count  || !price)
    {
        updateMessage("Please fill all the fields!")
        return -1;
    }
    
    updateMessage("Fractionalising the NFT... Please Wait (Upto 5 mins)")
    disableButton("frac-btn");

    try{
        var test = await contract1.fractionalise(tokenId,count,price);
        await test.wait();
        alert('You successfully fractionalised the NFT!');
    } catch (error) {
        alert(error);
    }
    updateMessage("");
    enableButton("frac-btn");
    window.location.reload(false);
}

async function loanNFT(tokenId) {
    
    const contract1 = await getFractionaliseContract();
    const loanDuration = document.querySelector("#loanDuration").value;
    const loanFraction = document.querySelector("#loanFraction").value;
    const loanAmount = document.querySelector("#loanAmount").value;

    if( !loanDuration  || !loanFraction || !loanAmount)
    {
        updateMessage("Please fill all the fields!")
        return -1;
    }
    
    updateMessage("Taking Loan  Please Wait (Upto 5 mins)")
    disableButton("loan-btn");
    try{
        var test = await contract1.takeLoan(loanAmount,tokenId,loanDuration,loanFraction);
        await test.wait();
        alert('You successfully taken Loan!');
        window.location.reload(false);
    } catch (error) {
        alert(error);
    }
    updateMessage("");
    enableButton("loan-btn");
}

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);
    if(typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.fractionalise} {data.seller} {data.fractionalise}</span>
                    </div>

                    <div>                          
                    { data.fractionalise?
                        <div>
                            Fractionalised Quantity : <span className="text-sm">{data.fractionaliseQty}</span>
                        </div>
                        :
                       <div></div>
                    }
                    </div>
                    
                    <div>
                            { data.fractionalise?
                                <div>
                                    Fractionalised Price : <span className="text-sm">{data.fractionalisePrice}</span>
                                </div>
                                :
                               <div></div>
                            }
                            </div>
                    <div>
                    { currAddress != data.owner && currAddress != data.seller && data.fractionalise && data.fractionaliseQty > 0?
                     <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Quantity To Buy</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="amtToSell"/>
                    </div> :  <div></div>
                    }

                     { currAddress != data.owner && currAddress != data.seller  && ((data.fractionalise && data.fractionaliseQty > 0 )|| (!data.fractionalise))?
                        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" id="buy-btn" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        : <div className="text-emerald-700">You are the owner of this NFT</div>
                    }
    
                    <div className="text-red-500 text-center mt-3">{message}</div>
                    { (currAddress == data.owner || currAddress == data.seller) && (data.fractionalise && data.fractionaliseQty > 0) && !data.loanActive?
                        <div className="mb-4">
                            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Amount of Loan (in wei)</label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="loanAmount" />
                            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Fractions You Want To Take Loan</label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="loanFraction" />
                            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Duration(in days)</label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="loanDuration" />
                            <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" id="loan-btn" onClick={() => loanNFT(tokenId)}>Loan this NFT</button>
                            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Fixed Rate of Intrest : 5%</label>
                        </div> : <div></div>
                        
                    }

                    <div className="mb-4">
                     { !(currAddress != data.owner && currAddress != data.seller )&& !data.fractionalise?
                         <div>
                            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Fractions To Split</label>
                         <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="count" />
                       </div>: <div></div>
                    }

                    { !(currAddress != data.owner && currAddress != data.seller )&& !data.fractionalise?
                         <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Fractional price</label>
                         <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" required="required" id="price" />
                       </div>: <div></div>
                    }

                    { !(currAddress != data.owner && currAddress != data.seller )&& !data.fractionalise?
                       <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" id="frac-btn" onClick={() => fraction(tokenId)}>Fractionalise this NFT
                       </button>: <div></div>
                    }       
                    
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}