import Alert from "./components/Alert";
import { IssuesProvider } from "./context/IssuesContext";

function App() {
  return (
    <IssuesProvider>
      <Alert />
    </IssuesProvider>
  );
}

export default App;
