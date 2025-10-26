import { beginCell, Cell, Address } from '@ton/ton';

/**
 * Создает state_init для плагина
 * @param {string} codeHex - Bytecode плагина в hex формате  
 * @param {Cell} data - Начальные данные плагина
 * @returns {Cell} state_init
 */
export function createStateInit(codeHex, data) {
    // Создаем код из hex (BoC формат)
    const codeCell = Cell.fromBoc(Buffer.from(codeHex, 'hex'))[0];

    // state_init структура согласно TL-B схеме
    const stateInit = beginCell()
        .storeBit(0) // split_depth: Nothing
        .storeBit(0) // special: Nothing  
        .storeBit(1) // code: Just
        .storeRef(codeCell)
        .storeBit(1) // data: Just
        .storeRef(data)
        .storeBit(0) // library: Nothing
        .endCell();

    return stateInit;
}

/**
 * Создает начальные данные для плагина
 * @param {string} walletAddress - Адрес кошелька-владельца
 * @returns {Cell} data cell
 */
export function createPluginData(walletAddress) {
    const addr = Address.parse(walletAddress);

    // Структура данных плагина - просто адрес владельца
    // Адаптируйте под вашу структуру если нужно
    const data = beginCell()
        .storeAddress(addr)
        .endCell();

    return data;
}

/**
 * Создает пустое тело сообщения для деплоя плагина
 * Согласно Python реализации: msg_body.refs.append(Cell())
 * @returns {Cell} пустой Cell
 */
export function createPluginDeployBody() {
    // Пустой Cell как в Python
    return beginCell().endCell();
}

/**
 * Создает payload для деплоя и установки плагина (op = 1)
 * 
 * Согласно Python коду в sign_plugin():
 * msg_body.bits.write_uint(1, 8)         # deploy + install plugin
 * msg_body.bits.write_int(0, 8)          # workchain 0
 * msg_body.bits.write_coins(value_nton)  # initial plugin balance
 * msg_body.refs.append(plugin_init)      # state_init
 * msg_body.refs.append(Cell())           # пустой Cell
 * 
 * @param {string} pluginCodeHex - Bytecode плагина в hex
 * @param {string} walletAddress - Адрес кошелька
 * @param {number} pluginWorkchain - Workchain плагина (обычно 0)
 * @param {bigint} pluginBalance - Баланс для деплоя в наноTON
 * @returns {string} Payload в base64
 */
export function createDeployAndInstallPluginPayload(
    pluginCodeHex,
    walletAddress,
    pluginWorkchain = 0,
    pluginBalance = 50000000n
) {
    try {
        console.log('  📝 Создание payload для op = 1');
        console.log('  ├─ Workchain:', pluginWorkchain);
        console.log('  ├─ Balance:', pluginBalance.toString(), 'nanoTON');
        console.log('  └─ Wallet:', walletAddress);

        // 1. Создаем данные для плагина
        const pluginData = createPluginData(walletAddress);
        console.log('  ✓ Plugin data created');

        // 2. Создаем state_init
        const stateInit = createStateInit(pluginCodeHex, pluginData);
        console.log('  ✓ State init created');

        // 3. Создаем пустое тело (как в Python: Cell())
        const pluginBody = createPluginDeployBody();
        console.log('  ✓ Empty body created');

        // 4. Создаем payload для кошелька с op = 1
        console.log('  📦 Building payload cell:');
        console.log('     └─ op: 1 (8 bits)');
        console.log('     └─ workchain: 0 (8 bits)');
        console.log('     └─ balance:', pluginBalance.toString(), '(coins)');
        console.log('     └─ state_init (ref)');
        console.log('     └─ body (ref)');

        const payload = beginCell()
            .storeUint(1, 8) // op = 1 (deploy and install plugin)
            .storeInt(pluginWorkchain, 8) // plugin_workchain
            .storeCoins(pluginBalance) // plugin_balance
            .storeRef(stateInit) // state_init as ref
            .storeRef(pluginBody) // пустой Cell as ref
            .endCell();

        const boc = payload.toBoc().toString('base64');
        console.log('  ✅ Payload BOC created, length:', boc.length);

        return boc;
    } catch (error) {
        console.error('❌ Ошибка создания payload для деплоя плагина:', error);
        throw error;
    }
}

/**
 * Вычисляет адрес плагина по state_init
 * @param {Cell} stateInit - State init плагина
 * @param {number} workchain - Workchain (обычно 0)
 * @returns {string} Адрес плагина
 */
export function calculatePluginAddress(stateInit, workchain = 0) {
    const hash = stateInit.hash();
    const address = new Address(workchain, hash);
    return address.toString();
}

/**
 * Создает транзакцию для деплоя плагина через TON Connect
 * @param {string} walletAddress - Адрес кошелька
 * @param {string} payload - Payload в base64
 * @param {string} amount - Сумма в TON для деплоя
 * @returns {object} Транзакция для TON Connect
 */
export function createDeployPluginTransaction(walletAddress, payload, amount = '0.05') {
    return {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
        messages: [{
            address: walletAddress,
            amount: amount,
            payload: payload
        }]
    };
}

/**
 * Полный процесс деплоя плагина с предустановленным bytecode
 * Реализация согласно Python функции sign_install_plugin()
 * 
 * @param {string} walletAddress - Адрес кошелька
 * @param {string} deployAmount - Сумма для деплоя в TON
 * @returns {object} { transaction, pluginAddress }
 */
export function deployPredefinedPlugin(walletAddress, deployAmount = '0.05') {
  console.log('🚀 === ДЕПЛОЙ ПЛАГИНА ===');
  console.log('📍 Wallet address:', walletAddress);
  console.log('💰 Deploy amount:', deployAmount);
  
  // Предустановленный bytecode плагина (wallet v4 code)
  const PLUGIN_CODE_HEX = 'b5ee9c7201020f01000262000114ff00f4a413f4bcf2c80b0102012002030201480405036af230db3c5335a127a904f82327a128a90401bc5135a0f823b913b0f29ef800725210be945387f0078e855386db3ca4e2f82302db3c0b0c0d0202cd06070121a0d0c9b67813f488de0411f488de0410130b048fd6d9e05e8698198fd201829846382c74e2f841999e98f9841083239ba395d497803f018b841083ab735bbed9e702984e382d9c74688462f863841083ab735bbed9e70156ba4e09040b0a0a080269f10fd22184093886d9e7c12c1083239ba39384008646582a803678b2801fd010a65b5658f89659fe4b9fd803fc1083239ba396d9e40e0a04f08e8d108c5f0c708210756e6b77db3ce00ad31f308210706c7567831eb15210ba8f48305324a126a904f82326a127a904bef27109fa4430a619f833d078d721d70b3f5260a11bbe8e923036f82370708210737562732759db3c5077de106910581047103645135042db3ce0395f076c2232821064737472ba0a0a0d09011a8e897f821064737472db3ce0300a006821b39982100400000072fb02de70f8276f118010c8cb055005cf1621fa0214f40013cb6912cb1f830602948100a032dec901fb000030ed44d0fa40fa40fa00d31fd31fd31fd31fd31fd307d31f30018021fa443020813a98db3c01a619f833d078d721d70b3fa070f8258210706c7567228018c8cb055007cf165004fa0215cb6a12cb1f13cb3f01fa02cb00c973fb000e0040c8500acf165008cf165006fa0214cb1f12cb1fcb1fcb1fcb1fcb07cb1fc9ed54005801a615f833d020d70b078100d1ba95810088d721ded307218100ddba028100deba12b1f2e047d33f30a8ab0f';
  
  console.log('📦 Code hex length:', PLUGIN_CODE_HEX.length);
  
  // Создаем данные плагина
  const pluginData = createPluginData(walletAddress);
  console.log('📄 Plugin data created');
  
  // Создаем state_init
  const stateInit = createStateInit(PLUGIN_CODE_HEX, pluginData);
  console.log('🔧 State init created');
  
  // Вычисляем адрес плагина
  const pluginAddress = calculatePluginAddress(stateInit, 0);
  console.log('🎯 Plugin address will be:', pluginAddress);
  
  // Конвертируем сумму в наноTON
  const balanceNano = BigInt(Math.floor(parseFloat(deployAmount) * 1e9));
  console.log('💵 Balance in nanoTON:', balanceNano.toString());
  
  // Создаем payload
  const payload = createDeployAndInstallPluginPayload(
    PLUGIN_CODE_HEX,
    walletAddress,
    0, // workchain = 0
    balanceNano
  );
  
  console.log('📨 Payload (base64):', payload.substring(0, 100) + '...');
  console.log('📏 Payload length:', payload.length);
  
  // Создаем транзакцию
  const transaction = createDeployPluginTransaction(walletAddress, payload, deployAmount);
  
  console.log('✅ Transaction created:', transaction);
  console.log('🚀 === ГОТОВО К ОТПРАВКЕ ===');
  
  return {
    transaction,
    pluginAddress
  };
}