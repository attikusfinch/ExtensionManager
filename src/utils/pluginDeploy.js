import { beginCell, Cell, Address } from '@ton/ton';

export function createStateInit(codeHex, data) {
    const codeCell = Cell.fromBoc(Buffer.from(codeHex, 'hex'))[0];
    const stateInit = beginCell()
        .storeBit(0).storeBit(0).storeBit(1)
        .storeRef(codeCell)
        .storeBit(1).storeRef(data)
        .storeBit(0)
        .endCell();
    return stateInit;
}

export function createPluginData(walletAddress, beneficiaryAddress = null) {
    const wallet = Address.parse(walletAddress);
    // Если бенефициар не указан, используем адрес кошелька
    const beneficiary = beneficiaryAddress ? Address.parse(beneficiaryAddress) : wallet;

    // Структура storage для subscription плагина:
    // wallet, beneficiary, amount, period, start_time, timeout, 
    // last_payment_time, last_request_time, failed_attempts, subscription_id
    const data = beginCell()
        .storeAddress(wallet) // wallet:MsgAddressInt
        .storeAddress(beneficiary) // beneficiary:MsgAddressInt
        .storeCoins(1000000000n) // amount:Grams (1 TON - пример)
        .storeUint(2592000, 32) // period:uint32 (30 дней в секундах)
        .storeUint(Math.floor(Date.now() / 1000), 32) // start_time:uint32
        .storeUint(86400, 32) // timeout:uint32 (1 день)
        .storeUint(0, 32) // last_payment_time:uint32
        .storeUint(0, 32) // last_request_time:uint32
        .storeUint(0, 8) // failed_attempts:uint8
        .storeUint(0, 32) // subscription_id:uint32
        .endCell();

    return data;
}

export function calculatePluginAddress(stateInit, workchain = 0) {
    const hash = stateInit.hash();
    return new Address(workchain, hash).toString();
}

/**
 * Деплой плагина через TON Connect
 * Отправляем internal message на адрес плагина со stateInit для деплоя
 */
export function deployPredefinedPlugin(walletAddress, deployAmount = '0.1', beneficiary = null) {
    console.log('🚀 DEPLOY SUBSCRIPTION PLUGIN');
    console.log('📍 Wallet:', walletAddress);
    console.log('👤 Beneficiary:', beneficiary || walletAddress);

    const CODE_HEX = 'b5ee9c7201020f01000262000114ff00f4a413f4bcf2c80b0102012002030201480405036af230db3c5335a127a904f82327a128a90401bc5135a0f823b913b0f29ef800725210be945387f0078e855386db3ca4e2f82302db3c0b0c0d0202cd06070121a0d0c9b67813f488de0411f488de0410130b048fd6d9e05e8698198fd201829846382c74e2f841999e98f9841083239ba395d497803f018b841083ab735bbed9e702984e382d9c74688462f863841083ab735bbed9e70156ba4e09040b0a0a080269f10fd22184093886d9e7c12c1083239ba39384008646582a803678b2801fd010a65b5658f89659fe4b9fd803fc1083239ba396d9e40e0a04f08e8d108c5f0c708210756e6b77db3ce00ad31f308210706c7567831eb15210ba8f48305324a126a904f82326a127a904bef27109fa4430a619f833d078d721d70b3f5260a11bbe8e923036f82370708210737562732759db3c5077de106910581047103645135042db3ce0395f076c2232821064737472ba0a0a0d09011a8e897f821064737472db3ce0300a006821b39982100400000072fb02de70f8276f118010c8cb055005cf1621fa0214f40013cb6912cb1f830602948100a032dec901fb000030ed44d0fa40fa40fa00d31fd31fd31fd31fd31fd307d31f30018021fa443020813a98db3c01a619f833d078d721d70b3fa070f8258210706c7567228018c8cb055007cf165004fa0215cb6a12cb1f13cb3f01fa02cb00c973fb000e0040c8500acf165008cf165006fa0214cb1f12cb1fcb1fcb1fcb1fcb07cb1fc9ed54005801a615f833d020d70b078100d1ba95810088d721ded307218100ddba028100deba12b1f2e047d33f30a8ab0f';

    const pluginData = createPluginData(walletAddress, beneficiary);
    const stateInit = createStateInit(CODE_HEX, pluginData);
    const pluginAddress = calculatePluginAddress(stateInit, 0);

    console.log('🎯 Subscription plugin address:', pluginAddress);
    console.log('💰 Subscription: 1 TON / 30 дней');

    // Создаем пустое тело (можно добавить op если нужно)
    const body = beginCell().endCell();

    // Кодируем stateInit в base64 для TON Connect
    const stateInitBoc = stateInit.toBoc().toString('base64');
    const bodyBoc = body.toBoc().toString('base64');

    // Amount в наноTON
    const amountNano = Math.floor(parseFloat(deployAmount) * 1e9).toString();

    console.log('Amount (nanoTON):', amountNano);
    console.log('StateInit length:', stateInitBoc.length);

    // Транзакция для TON Connect: деплой на адрес плагина
    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
            address: pluginAddress, // отправляем НА АДРЕС ПЛАГИНА
            amount: amountNano,
            stateInit: stateInitBoc, // для деплоя
            payload: bodyBoc // пустое тело
        }]
    };

    console.log('✅ Transaction ready');
    console.log('Transaction:', transaction);

    return { transaction, pluginAddress };
}