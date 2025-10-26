import { Address, TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

let tonClient = null;

function getTonClient() {
  if (!tonClient) {
    tonClient = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });
  }
  return tonClient;
}

export async function createInstallPluginExternalMessage(
  mnemonicWords,
  walletAddress,
  pluginAddress,
  amount = 50000000n
) {
  try {
    console.log('🔐 Установка плагина (op=2)');
    
    const client = getTonClient();
    const keyPair = await mnemonicToPrivateKey(mnemonicWords.split(' '));
    console.log('✓ Ключи получены');
    
    const wallet = client.open(WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0
    }));
    
    console.log('✓ Wallet создан:', wallet.address.toString());
    
    const seqno = await wallet.getSeqno();
    console.log('📊 Seqno:', seqno);
    
    const pluginAddr = Address.parse(pluginAddress);
    console.log('📍 Plugin:', pluginAddr.toString());
    
    const tx = await wallet.createAddPlugin({
      seqno: seqno,
      secretKey: keyPair.secretKey,
      address: pluginAddr,
      forwardAmount: amount,
      queryId: BigInt(Date.now())
    });
    
    console.log('✅ Tx готов');
    
    return { tx, wallet };
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  }
}

export async function createRemovePluginExternalMessage(
  mnemonicWords,
  walletAddress,
  pluginAddress,
  amount = 50000000n
) {
  try {
    console.log('🔐 Удаление плагина (op=3)');
    
    const client = getTonClient();
    const keyPair = await mnemonicToPrivateKey(mnemonicWords.split(' '));
    console.log('✓ Ключи получены');
    
    const wallet = client.open(WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0
    }));
    
    console.log('✓ Wallet создан:', wallet.address.toString());
    
    const seqno = await wallet.getSeqno();
    console.log('📊 Seqno:', seqno);
    
    const pluginAddr = Address.parse(pluginAddress);
    console.log('📍 Plugin:', pluginAddr.toString());
    
    const tx = await wallet.createRemovePlugin({
      seqno: seqno,
      secretKey: keyPair.secretKey,
      address: pluginAddr,
      forwardAmount: amount,
      queryId: BigInt(Date.now())
    });
    
    console.log('✅ Tx готов');
    
    return { tx, wallet };
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  }
}

export async function sendExternalMessage(result) {
  try {
    console.log('⏳ Ждем 2 сек...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📤 Отправка...');
    
    const { tx, wallet } = result;
    await wallet.send(tx);
    
    console.log('✅ Отправлено!');
    console.log('📝 Hash:', tx.hash().toString('hex'));
    
    return { ok: true, hash: tx.hash().toString('hex') };
  } catch (error) {
    console.error('❌ Ошибка отправки:', error);
    throw error;
  }
}

