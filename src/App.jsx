import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { MainPage } from './components/MainPage';
import './App.css';

function App() {
    return (
        <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
            <MainPage />
        </TonConnectUIProvider>
    );
}

export default App;

