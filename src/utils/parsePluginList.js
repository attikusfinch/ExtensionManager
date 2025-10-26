/**
 * Примеры парсинга результатов get_plugin_list
 * Адаптируйте под структуру данных вашего смарт-контракта
 */

/**
 * Пример 1: Если get_plugin_list возвращает список адресов (tuple of addresses)
 */
export function parsePluginListAsAddresses(stack) {
  try {
    const plugins = [];
    const tuple = stack.readTuple();
    
    while (tuple.remaining > 0) {
      try {
        const addressSlice = tuple.readAddress();
        plugins.push({
          id: plugins.length,
          address: addressSlice.toString(),
          type: 'address'
        });
      } catch (e) {
        break;
      }
    }
    
    return plugins;
  } catch (error) {
    console.error('Ошибка парсинга адресов:', error);
    return [];
  }
}

/**
 * Пример 2: Если get_plugin_list возвращает список чисел (IDs)
 */
export function parsePluginListAsNumbers(stack) {
  try {
    const plugins = [];
    const tuple = stack.readTuple();
    
    while (tuple.remaining > 0) {
      try {
        const pluginId = tuple.readBigNumber();
        plugins.push({
          id: plugins.length,
          pluginId: pluginId.toString(),
          type: 'number'
        });
      } catch (e) {
        break;
      }
    }
    
    return plugins;
  } catch (error) {
    console.error('Ошибка парсинга чисел:', error);
    return [];
  }
}

/**
 * Пример 3: Если get_plugin_list возвращает словарь/hashmap
 */
export function parsePluginListAsDict(stack) {
  try {
    const plugins = [];
    const dict = stack.readCellOpt();
    
    if (dict) {
      // Парсинг словаря зависит от структуры
      // Это базовый пример
      plugins.push({
        id: 0,
        data: dict.toString(),
        type: 'dict'
      });
    }
    
    return plugins;
  } catch (error) {
    console.error('Ошибка парсинга словаря:', error);
    return [];
  }
}

/**
 * Пример 4: Если get_plugin_list возвращает cell с данными
 */
export function parsePluginListAsCell(stack) {
  try {
    const plugins = [];
    
    if (stack.remaining > 0) {
      const cell = stack.readCell();
      const slice = cell.beginParse();
      
      // Пример чтения данных из cell
      // Адаптируйте под вашу структуру
      while (slice.remainingBits > 0) {
        try {
          // Пример: читаем 32-битное число
          if (slice.remainingBits >= 32) {
            const value = slice.loadUint(32);
            plugins.push({
              id: plugins.length,
              value: value.toString(),
              type: 'cell_data'
            });
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      }
    }
    
    return plugins;
  } catch (error) {
    console.error('Ошибка парсинга cell:', error);
    return [];
  }
}

/**
 * Универсальный парсер - пытается определить тип автоматически
 */
export function parsePluginListAuto(stack) {
  try {
    // Сохраняем позицию стека
    const originalStack = stack.clone();
    
    // Пробуем разные варианты парсинга
    let result = parsePluginListAsAddresses(stack.clone());
    if (result.length > 0) return result;
    
    result = parsePluginListAsNumbers(stack.clone());
    if (result.length > 0) return result;
    
    result = parsePluginListAsDict(stack.clone());
    if (result.length > 0) return result;
    
    result = parsePluginListAsCell(stack.clone());
    if (result.length > 0) return result;
    
    // Если ничего не подошло, возвращаем сырые данные
    return [{
      id: 0,
      data: 'Raw data - требуется кастомный парсер',
      raw: originalStack.toString(),
      type: 'unknown'
    }];
  } catch (error) {
    console.error('Ошибка автопарсинга:', error);
    return [];
  }
}

