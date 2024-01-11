declare namespace App {
  interface Remote {
    showDialog(message: string): Promise<void>
  }
}

interface Window {
  app: App.Remote
}
