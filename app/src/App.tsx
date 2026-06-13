import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Contact from './pages/Contact'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </>
  )
}
