import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Buffer } from "buffer";
import kp from './keypair.json';
window.Buffer = Buffer;


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;
const network = clusterApiUrl('devnet');
const programID = new PublicKey('4zz2dbF2hQVFCC37m8P7FU6P9mbWcjLLJ9V5ENs6qqoR');
const opts = {
  preflightCommitment : "processed"
}
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  // Actions
  const checkIfWalletIsConnected = async function() {
    if(window?.solana?.isPhantom) {
      console.log('Phantom wallet was found.');
      /**
       * The solana object give us a function that will allow us to connect
       * directly with user's walllet
       *  */ 
      // const response = await window.solana.connect({onlyIfTrusted: true});
      const response = await window.solana.connect();
      setWalletAddress(response.publicKey.toString())
    } else {
      alert('Solana Object not found! Find a Phantom Wallet extension!')
    }
  }
  const connectWallet = () => {
    const {solana} = window;
    if(solana) {
      const response = solana.connect();
      console.log('public key: ', response.publicKey.toString())
      setWalletAddress(solana.publicKey.toString())
    }
  };
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('')
    console.log('Gif link: ',inputValue);
    try {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        },
      });
      console.log("GIF successfully sent to program ",inputValue)
      await getGifList();
    }catch (error) {
      console.log("Error sending GIF: ",error);
    }
  };
  const renderNotConnectedContainer = () => {
    return <button className='cta-button connect-wallet-button'
      onClick={connectWallet}>
        Connect to Wallet
    </button>
  }
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment
    )
    return provider
  }
  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return <div className="connected-container">
          {/* Go ahead and add this input and button to start */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
          <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className='gif-grid'>
        {gifList.map((gif) => {
          console.log(gif);
          return <div className="gif-item" key={gif}>
            <img src={gif.gifLink} alt={gif.gifLink} />
          </div>
        })}
        </div>
      </div>
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad)
  }, [])

  const getProgram = async () => {
    // Get metadata from your solana program
    const idl = await Program.fetchIdl(programID, getProvider());
    // Create a Program that you can call
    return new Program(idl, programID, getProvider())
  }

  const createGifAccount = async () => {
    console.log('createGifAccount')
    try {
      console.log("ping 0")
      const provider = getProvider();
      console.log("ping 1")
      const program = await getProgram();
      
      console.log("ping ", program)
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async () => {
    try {
      const program = await getProgram();
      let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      setGifList(account.giftList)
    }catch(e) {
      console.log("Error in getGifList: ", e)
      setGifList(null);
    } 
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  },[setGifList]);

  return (
    <div className="App">
      <div className="container">
        {/* This was solely added for some styling fanciness */}
        <div className={walletAddress ? 'authed-container' : 'container'}></div>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {/* Render your connect to wallet button right here */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
