import 'react-native-get-random-values';
import { install } from 'react-native-quick-crypto';
install();

module.exports = { webcrypto: global.crypto };