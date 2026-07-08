declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi: any;
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId?: string) => GoogleDocsView;
        DocsViewMode: { GRID: string; LIST: string };
        ViewId: { DOCS: string; FOLDERS: string };
        Action: { PICKED: string; CANCEL: string };
        Feature: { MULTISELECT_ENABLED: string };
      };
    };
  }
}

interface GooglePickerBuilder {
  addView(view: GoogleDocsView): GooglePickerBuilder;
  enableFeature(feature: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setCallback(callback: (data: GooglePickerResponse) => void): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  build(): { setVisible(visible: boolean): void };
}

interface GoogleDocsView {
  setMimeTypes(mimeTypes: string): GoogleDocsView;
}

interface GooglePickerResponse {
  action: string;
  docs?: GooglePickerDocument[];
}

export interface GooglePickerDocument {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

let pickerApiLoaded = false;
let gapiLoaded = false;

export function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pickerApiLoaded && gapiLoaded) {
      resolve();
      return;
    }

    if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          pickerApiLoaded = true;
          gapiLoaded = true;
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    } else {
      window.gapi.load('picker', () => {
        pickerApiLoaded = true;
        gapiLoaded = true;
        resolve();
      });
    }
  });
}

export async function openGoogleDrivePicker(
  accessToken: string,
  onFilesSelected: (files: GooglePickerDocument[]) => void
): Promise<void> {
  await loadGooglePickerApi();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

  const picker = new window.google.picker.PickerBuilder()
    .addView(new window.google.picker.DocsView())
    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
    .setOAuthToken(accessToken)
    .setDeveloperKey(apiKey)
    .setTitle('Select files to attach')
    .setCallback((data: GooglePickerResponse) => {
      if (data.action === window.google.picker.Action.PICKED && data.docs) {
        onFilesSelected(data.docs);
      }
    })
    .build();

  picker.setVisible(true);
}

export function getGoogleDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
