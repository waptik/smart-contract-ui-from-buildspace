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


  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS

  const contractABI = ClapPortalJson.abi


  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const clapPortalContract = new ethers.Contract(contractAddress, contractABI, signer)


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

      if (allClaps.length < 1) {
        setAllClaps(clapsCleaned)
      }

      /**
       * Listen in for emitter events!
       */
      clapPortalContract.on("NewClap", async (from, timestamp, message) => {
        console.log("NewClap", from, timestamp, message);

        setAllClaps(prevState => [...prevState, {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        }]);


      });

      const count = await clapPortalContract.getTotalClaps()
      console.log("Retrieved total claps count...", count.toNumber());
      setCountClaps(count.toNumber())
    } catch (error) {
      console.log(error);

    }


  }



  const checkIfWalletIsConnected = () => {

    //let's check if ethereum is available in the browser
    const { ethereum } = window

    if (!ethereum) {
      alert("You need to have metamask or similar extension installed in your browser");
      return
    }

    // check for account linked the ethereum
    ethereum.request({ method: "eth_accounts" }).then(async accounts => {
      if (accounts.length > 0) {
        const account = accounts[0]

        setCurrentAccount(account)
      } else {
        console.log("Eish, no account was found")
      }
      await getAllClaps()
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
    checkIfWalletIsConnected()
  }, [])


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
          Heya! Stephane here, getting started into the world of crypto. This is my first web3 website. Sounds fun right? Connect your Ethereum wallet and clap for me if you like what i do(Psss, you might stand the chance of getting something back in return)!
        </div>

        {currentAccount ? (

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "2rem" }}>
            <textarea style={{ width: "100%", margin: "2rem" }} placeholder="Message" value={message} onChange={e => {
              e.preventDefault();
              const text = e.target.value
              setMessage(text)
            }} />
            <button className="clapButton" disabled={isMining} onClick={clap}>
              Clap for Me
        </button>
          </div>
        ) : <button className="clapButton" onClick={connectWallet}>
            Connect your wallet
        </button>
        }

        {isMining ? <span>Please wait while i am mining...</span> : <span>Received a total of {countClaps} claps</span>}


        {allClaps.map((clap, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", marginBottom: "16px", padding: "8px" }}>
              <div>Address: {clap.address}</div>
              <div>Time: {clap.timestamp.toString()}</div>
              <div>Message: {clap.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
