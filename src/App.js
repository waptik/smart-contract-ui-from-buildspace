import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import ClapPortalJson from './utils/ClapPortal.json'

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('')
  const [countClaps, setCountClaps] = useState(0)
  const [isMining, setIsMining] = useState(false)
  const [allClaps, setAllClaps] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)


  const contractAddress = "0xB04740b01A6EaDDeC11Ce1Bf5E4974738984901F"
  const contractABI = ClapPortalJson.abi


  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const clapPortalContract = new ethers.Contract(contractAddress, contractABI, signer)






  const checkIfEthereumIsAvailable = () => {

    //let's check if ethereum is available in the browser
    const { ethereum } = window

    if (!ethereum) {
      alert("You need to have metamask or similar extension installed in your browser");
      return
    }

    // check for account linked the ethereum
    ethereum.request({ method: "eth_accounts" }).then(accounts => {
      if (accounts.length > 0) {
        const account = accounts[0]

        setCurrentAccount(account)
      } else {
        console.log("Eish, no account was found")
      }
    })
  }

  const connectWallet = () => {
    const { ethereum } = window

    if (!ethereum) {
      alert("Install Metamask or similar extension")
      return
    }

    ethereum.request({ method: "eth_requestAccounts" }).then(accounts => {
      if (accounts.length > 0) {
        const account = accounts[0]
        console.log("Account connected: ", account)
        setCurrentAccount(account)

      }
    })
  }

  const clap = async () => {
    try {
      if (message === '') {
        setError('Sorry, please add a message')
        return;
      }
      setIsMining(true)
      const clapTxn = await clapPortalContract.clap(message, { gasLimit: 300000 })
      await clapTxn.wait()
      const count = await clapPortalContract.getTotalClaps()
      setCountClaps(count.toNumber())
      setIsMining(false)
      setMessage('')
    } catch (err) {
      if (err.message.includes("Cooldown")) {
        const split = err.error.message.split("|")
        console.log({ split, err })
        setError(`Sorry, the action "clap" cannot be done at this moment. Please try again after ${split[1]}`)
      } else {
        setError(`Sorry, you cannot clap at this moment because: ${err.message}`)
      }

      setIsMining(false)
    }


  }


  useEffect(() => {
    checkIfEthereumIsAvailable()

    const getTotalClaps = async () => {
      const count = await clapPortalContract.getTotalClaps()
      setCountClaps(count.toNumber())
    }
    getTotalClaps()
  }, [clapPortalContract])

  useEffect(() => {
    const getAllClaps = async () => {
      try {
        const { ethereum } = window
        if (!ethereum) {
          console.log("Ethereum object doesn't exist!")
          return
        }

        const claps = await clapPortalContract.getAllClaps()

        let clapsCleaned = []

        claps.forEach(clap => {
          clapsCleaned.push({
            address: clap.clapper,
            message: clap.message,
            timestamp: new Date(clap.timestamp * 100)
          })
        })

        setAllClaps(clapsCleaned)
      } catch (error) {
        console.log(error);

      }


    }

    if (currentAccount)
      getAllClaps()
  }, [clapPortalContract, currentAccount])


  useEffect(() => {
    if (error) {
      alert(error)
    }
  }, [error])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="wave-emoji">👋</span> Heya fellas!
        </div>

        <div className="bio">
          Steve here, getting started into the world of crypto. Sounds fun right? Connect your Ethereum wallet and clap for me if you like what i do!
        </div>

        {currentAccount ? (

          <>
            <span>Message</span> <textarea value={message} onChange={e => {
              e.preventDefault();
              const text = e.target.value
              setMessage(text)
            }} />
            <button className="clapButton" disabled={isMining} onClick={clap}>
              Clap for Me
        </button>
          </>
        ) : <button className="clapButton" onClick={connectWallet}>
            Connect your wallet
        </button>
        }

        {isMining ? <span>Please wait while i am mining...</span> : <span>Received a total of {countClaps} claps</span>}


        {allClaps.map((clap, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {clap.address}</div>
              <div>Time: {clap.timestamp.toString()}</div>
              <div>Message: {clap.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
