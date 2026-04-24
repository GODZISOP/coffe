let Expo;
let expoInstance;

const initExpo = async () => {
  try {
    const mod = await import('expo-server-sdk');
    Expo = mod.Expo;
    expoInstance = new Expo();
    console.log('🚀 Expo Push SDK Initialized and Ready');
    return expoInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Expo SDK:', error);
    return null;
  }
};

const getExpo = () => {
  if (!expoInstance) {
    console.warn('⚠️ Expo not yet initialized');
  }
  return expoInstance;
};

module.exports = { initExpo, getExpo };
