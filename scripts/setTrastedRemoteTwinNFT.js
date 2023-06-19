const ethers = require('ethers');
require("dotenv").config();

// プライベートキーとインフラストラクチャプロバイダの設定
const privateKey = process.env.PRIVATE_KEY;
const providerUrl = process.env.ALC_GOERLI_URL;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// コントラクトのアドレスとABIの設定
const token721Address = '0x93c01833a03e3ac5F4352254beD98f49467d2dE6';
const twin721Address = '0xbD65Dd40Ec0664d74A8Ea3BDe3219D3BF2682ec9';
const twin721ABI = [    
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "_remoteChainId",
				"type": "uint16"
			},
			{
				"internalType": "bytes",
				"name": "_path",
				"type": "bytes"
			}
		],
		"name": "setTrustedRemote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
]; // ABI

// コントラクトのインスタンス作成
const twin721Contract = new ethers.Contract(twin721Address, twin721ABI, wallet);

// Step 1: twin721コントラクトの設定
async function setTwin721TrustedRemote(chainId) {
  await twin721Contract.setTrustedRemote(
    chainId,
    ethers.utils.solidityPack(["address", "address"], [token721Address, twin721Address])
  );

  console.log('token721コントラクトの設定が正常に送信されました。');
}

// Step 1の呼び出し
const chainId = 10109; // mumbai
setTwin721TrustedRemote(chainId)
  .then(() => {
    console.log('--- Step 1 完了 ---');
    console.log();
    console.log('次に、Step 2 を実行してください。');
  })
  .catch((error) => {
    console.error('Step 1 中にエラーが発生しました:', error);
    process.exit(1);
  });
