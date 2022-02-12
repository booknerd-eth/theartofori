import React, { useEffect, useState } from 'react';
import Toast from 'react-bootstrap/Toast'
import Swal from 'sweetalert'

import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";

import {ADDRESS, ABI} from "../config.js"
import swal from 'sweetalert';

export const WalletContext = React.createContext({});

const WalletContextProvider = ({children}) => {

  // FOR WALLET
  const [signedIn, setSignedIn] = useState(false)

  const [walletAddress, setWalletAddress] = useState(null)

  const [network, setNetwork] = useState(null)

  // FOR MINTING
  const [TheArtOfOriContract, setTheArtOfOriContract] = useState(null)
  const [mintResult, setMintResult] = useState(false)
  const [mintStart, setMintStart] = useState(false)

  // INFO FROM SMART Contract
  const [totalSupply, setTotalSupply] = useState(0)
  const [tokenPrice, setTokenPrice] = useState(0)
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenOwner, setTokenOwner] = useState('')
  const [tokenUri, setTokenUri] = useState('')
  const [maxTokenCount, setMaxTokenCount] = useState(0)
  const [currentTokenCount, setCurrentTokenCount] = useState(0)

  useEffect( () => { 

    // signOut()

  }, [signedIn])
  
  useEffect( () => { 
    
    console.log("==========update========")
    if(signedIn == true){
      console.log("==========update123========")
      callContractData(walletAddress)
      setMintResult(false)
      setMintStart(false)
    }
    
  }, [mintResult])

  async function signIn() {
    if (typeof window.web3 !== 'undefined') {
      // Use existing gateway
      window.web3 = new Web3(window.ethereum);
        
        window.ethereum.enable()
        .then(function (accounts) {
            window.web3.eth.net.getNetworkType()
            // checks if connected network is mainnet (change this to rinkeby if you wanna test on testnet)
            .then((network) => {
                console.log(network);
                setNetwork(network)
                if(network != "main"){
                  setNetwork(network)
                  Swal("You are on " + network+ " network. Change network to mainnet or you won't be able to do anything here")
                  // alert("You are on " + network+ " network. Change network to mainnet or you won't be able to do anything here")
                } 
            }).catch(function (err) {
                console.log(err)
            });  

            let wallet = accounts[0]
            setWalletAddress(wallet)
            setSignedIn(true)

            callContractData(wallet)
        })
        .catch(function (error) {
        // Handle error. Likely the user rejected the login
        console.error(error)
        })
     
    } else {
      // alert("No Ethereum interface injected into browser. Read-only access");
      swal({
        title: "Please install metamask!",
        text: "No Ethereum interface injected into browser. Read-only access",
        icon: "warning",
        button: "OK",
      });
    }
  }

  


  async function signOut() {
    setSignedIn(false)
  }

  
 const getWalletBalance = async (address) => {
    if (!window.web3) {
        return
    }
    if (address !== "") {
        console.log("=getBalance=", await window.web3.eth.getBalance(address))
        console.log("=getNetworkType", await window.web3.eth.net.getNetworkType())
        return Number.parseFloat(window.web3.utils.fromWei(await window.web3.eth.getBalance(address), 'ether')).toFixed(6)
    } else {
        return 0
    }
  }

  async function mintTheArtOfOri() {
      const walletBalance = await getWalletBalance(walletAddress);
     console.log("============walletBalance==========", walletBalance)

    if(network != "main"){
      swal({
        title: "Mint Error",
        text: "You are on " + network+ " network. Change network to mainnet or you won't be able to do anything here",
        icon: "warning",
        // buttons: true,
        dangerMode: true,
      })
      return                 
    } 
    if (TheArtOfOriContract) { 
      const tokenId = 1;
      
      tokenId = (totalSupply + 1)  % 400; 
      const tokenSupplyById = await TheArtOfOriContract.methods.currentSupply(tokenId).call() 
      if(tokenSupplyById == 10) return
      
      const price = tokenPrice
      console.log("tokenPrice=", price)

      let WalletBalanceWei = window.web3.utils.toWei(`${walletBalance}`, "ether")
  
      console.log("tokenPrice_wei=", WalletBalanceWei)

      if(WalletBalanceWei >= price){
        setMintStart(true)

        const gasAmount = await TheArtOfOriContract.methods.mint(tokenId).estimateGas({from: walletAddress, value: price})
        console.log("estimated gas",gasAmount)

          console.log({from: walletAddress, value: price})

          TheArtOfOriContract.methods
                .mint(tokenId)
                .send({from: walletAddress, value: price, gas: String(gasAmount)})
                .on('transactionHash', function(hash){
                  console.log("transactionHash", hash)
                  setMintResult(true)

                  console.log("====mintresult ===", mintResult);
                  
                  swal({
                    title: "Success!",
                    text: "Mint success!",
                    icon: "success",
                    button: "Ok",
                  });
                })

          
      }else{
        swal({
          title: "Mint Error",
          text: "The your balance is lower, the price of this token is 2 ether.",
          icon: "warning",
          // buttons: true,
          dangerMode: true,
        })
      }      
    } else {
        console.log("Contract not connected")        
        swal({
          title: "Connect Error",
          text: "Contract not connected.",
          icon: "warning",
          // buttons: true,
          dangerMode: true,
        })
    }
  };

  const withdraw = async () => {
    if (!window.web3) {
        return false
    }
    try {
      let balanceOfContract = await web3.eth.getBalance(ADDRESS)
      if( balanceOfContract > 0){
        let gasFee = await TheArtOfOriContract.methods.withdraw().estimateGas({
            from: walletAddress, 
        });
        let result = await TheArtOfOriContract.methods.withdraw().send({
            from: walletAddress,
            gas: gasFee
        });
        return result;
      } else {
        swal({
          title: "Please withdraw after",
          text: "The balance of this contract is 0.",
          icon: "warning",
          // buttons: true,
          dangerMode: true,
        })
      }
    } catch(e) {
        console.log(e)
        return false
    }
  }
  
  async function callContractData(wallet) {
    const myTheArtOfOriContract = new window.web3.eth.Contract(ABI, ADDRESS)
    setTheArtOfOriContract(myTheArtOfOriContract)
        
    const total_Supply = await myTheArtOfOriContract.methods.totalSupply().call() 
    setTotalSupply(total_Supply)
    console.log("===total supply===", totalSupply)

    const token_Price = await myTheArtOfOriContract.methods.tokenPrice().call() 
    setTokenPrice(token_Price)
    console.log("===tokenPrice===", token_Price)

    // const baseURI = await TheArtOfOriContract.methods.baseURI().call() 
    // console.log("===baseURI===", baseURI)

    // const currentSupply = await TheArtOfOriContract.methods.currentSupply(1).call() 
    // console.log("===currentSupply===", currentSupply)

    const current_TokenCount = await myTheArtOfOriContract.methods.currentTokenCount().call() 
    setCurrentTokenCount(current_TokenCount)
    console.log("===currentTokenCount===", currentTokenCount)

    const MAX_TOKEN = await myTheArtOfOriContract.methods.MAX_TOKEN().call() 
    setMaxTokenCount(MAX_TOKEN)
    console.log("===max_token===", MAX_TOKEN)
    console.log("===max_token===", maxTokenCount)

  
    // const EACH_TOKEN_SUPPLY = await myTheArtOfOriContract.methods.EACH_TOKEN_SUPPLY().call() 
    // console.log("===EACH_TOKEN_SUPPLY===", EACH_TOKEN_SUPPLY)
    
    const name = await myTheArtOfOriContract.methods.name().call() 
    setTokenName(name)
    
    const symbol = await myTheArtOfOriContract.methods.symbol().call() 
    setTokenSymbol(symbol)
    
    const owner = await myTheArtOfOriContract.methods.owner().call() 
    setTokenOwner(owner.toLowerCase())
    console.log("+++++= owner =++++++", owner.toLowerCase())
   
    const uri = await myTheArtOfOriContract.methods.uri(11).call() 
    setTokenUri(uri)
  }

  
    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                network,
                TheArtOfOriContract,
                // getValue,
                signIn,
                signOut,
                signedIn,
                setSignedIn,
                totalSupply,
                setTotalSupply,
                tokenPrice,
                setTokenPrice,
                tokenName,
                tokenSymbol,
                tokenOwner,
                tokenUri,
                currentTokenCount,
                maxTokenCount,
                mintTheArtOfOri,
                withdraw,
                mintStart
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export default WalletContextProvider;