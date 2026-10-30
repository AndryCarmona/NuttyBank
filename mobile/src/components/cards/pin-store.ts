import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { validPin } from './card-utils';

// El NIP NO se guarda con los demás datos de la tarjeta (AsyncStorage guarda texto sin cifrar):
// vive solo en el almacén seguro del sistema (Keychain en iOS, Keystore en Android),
// separado por usuario y por tarjeta, y nunca sale del teléfono.
export const pinSupported = Platform.OS !== 'web';

// SecureStore solo admite letras, números, ".", "-" y "_" en la clave.
const keyFor = (userId: string, cardId: string) => `nuttybank-pin_${userId}_${cardId}`.replace(/[^A-Za-z0-9._-]/g, '_');
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

function ensure(userId: string | null): string {
  if (!pinSupported) throw Error('El NIP solo se puede guardar en la app del teléfono.');
  if (!userId) throw Error('Inicia sesión para guardar el NIP.');
  return userId;
}

export async function savePin(userId: string | null, cardId: string, pin: string) {
  const id = ensure(userId);
  if (!validPin(pin)) throw Error('El NIP debe tener de 4 a 6 dígitos.');
  await SecureStore.setItemAsync(keyFor(id, cardId), pin, options);
}

export async function readPin(userId: string | null, cardId: string): Promise<string | null> {
  return SecureStore.getItemAsync(keyFor(ensure(userId), cardId), options);
}

export async function deletePin(userId: string | null, cardId: string) {
  await SecureStore.deleteItemAsync(keyFor(ensure(userId), cardId), options);
}
