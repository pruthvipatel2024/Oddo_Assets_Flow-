import { BrowserRouter } from "react-router-dom"
import { Providers } from "@/app/Providers"
import { AppRoutes } from "@/app/AppRoutes"

function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  )
}

export default App
