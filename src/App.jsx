import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { MainPage } from './components/MainPage';
import './App.css';

function App() {
    return (
        <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/ExtensionManager/main/tonconnect-manifest.json">
            <MainPage />
        </TonConnectUIProvider>
    );
}

export default App;

