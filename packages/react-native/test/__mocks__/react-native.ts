/* eslint-disable @typescript-eslint/no-unused-vars */
export const Platform = {
  OS: "ios" as string,
  Version: "18.0" as number | string,
  constants: {
    interfaceIdiom: "phone",
    isTesting: false,
    osVersion: "18.0",
    reactNativeVersion: {
      major: 0,
      minor: 85,
      patch: 3,
      prerelease: null
    },
    systemName: "iOS"
  } as Record<string, unknown>,
  select: (specifics: Record<string, unknown>) => specifics.ios ?? specifics.default
};

export const AppState = {
  currentState: "active" as string,
  addEventListener: (type: string, handler: (state: string) => void) => ({
    remove: () => {}
  })
};

export const NativeModules = {
  ExceptionlessReactNative: null
};
