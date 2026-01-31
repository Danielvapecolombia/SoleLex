// @ts-ignore
const gapi = window.gapi;
// @ts-ignore
const google = window.google;

// Read keys from specific env vars populated by index.html
const API_KEY = process.env.GOOGLE_API_KEY || '';
const CLIENT_ID = process.env.CLIENT_ID || '';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

let tokenClient: any;
let accessToken: string | null = null;
let isGapiLoaded = false;
let isGisLoaded = false;

export const initGoogleServices = async () => {
  return new Promise<void>((resolve, reject) => {
    // If critical keys are missing, we skip initialization but resolve the promise
    // so the app can continue loading (e.g. for Guest Mode).
    if (!API_KEY || !CLIENT_ID) {
       console.log("Google API Key or Client ID missing. Google Services integration disabled.");
       resolve();
       return;
    }

    const handleGapiLoad = async () => {
        try {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
            isGapiLoaded = true;
            checkLoaded(resolve);
        } catch (error) {
            console.error("GAPI client init failed", error);
            // We verify if gapi loaded even if init failed to allow partial functionality if possible, 
            // but usually this means config is wrong.
            reject(error);
        }
    };

    try {
        if (typeof gapi !== 'undefined') {
            gapi.load('client:picker', handleGapiLoad);
        } else {
            console.warn("gapi script not loaded in window");
        }

        if (typeof google !== 'undefined' && google.accounts) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse: any) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        accessToken = tokenResponse.access_token;
                    }
                },
            });
            isGisLoaded = true;
            checkLoaded(resolve);
        } else {
             console.warn("google gsi script not loaded in window");
        }
    } catch (e) {
        console.error("Google services init crashed", e);
        reject(e);
    }
  });
};

const checkLoaded = (resolve: () => void) => {
  if (isGapiLoaded && isGisLoaded) {
    resolve();
  }
};

export const handleLogin = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      if (!CLIENT_ID) {
          reject("No se ha configurado el Client ID de Google. Ve a Configuración o usa el Modo Invitado.");
      } else {
          reject("Los servicios de Google no se han inicializado correctamente. Por favor recarga la página.");
      }
      return;
    }

    // Override callback for this specific login request
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(resp);
      }
      accessToken = resp.access_token;
      resolve(resp.access_token);
    };

    if (accessToken === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export const openDrivePicker = async (): Promise<DriveFile | null> => {
  if (!accessToken) {
    throw new Error("Usuario no autenticado en Google.");
  }

  if (!isGapiLoaded) {
      throw new Error("La API de Google Picker no está cargada.");
  }

  return new Promise((resolve, reject) => {
    const view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes("application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain");

    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setDeveloperKey(API_KEY)
      .setAppId(CLIENT_ID)
      .setOAuthToken(accessToken)
      .addView(view)
      .addView(new google.picker.DocsUploadView())
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const file = data.docs[0];
          resolve({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType
          });
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
};

export const downloadFileContent = async (fileId: string): Promise<ArrayBuffer> => {
  if (!accessToken) throw new Error("No hay token de acceso.");

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Error descargando archivo: ${response.statusText}`);
  }

  return await response.arrayBuffer();
};

export const getUserInfo = async (token: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
};